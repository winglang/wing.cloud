bring cloud;
bring http;
bring ex;
bring util;
bring "./types/probot-types.w" as probot;
bring "./types/octokit-types.w" as octokit;
bring "./lowkeys-map.w" as lowkeys;
bring "./github-app.w" as github;
bring "./runtime/runtime-callbacks.w" as runtime_callbacks;
bring "./environments.w" as environments;
bring "./apps.w" as apps;
bring "./status-reports.w" as status_reports;
bring "./github-comment.w" as comment;

struct VerifyAndReceieveProps {
  id: str;
  name: str;
  signature: str;
  payload: str;
}

interface IProbotWebhooks {
  inflight on(name: str, handler: inflight (): void);
  inflight verifyAndReceive(props: VerifyAndReceieveProps);
}

interface IProbotAuth {
  inflight call(ProbotInstance, installationId: num): octokit.OctoKit;
}

struct ProbotInstance {
  webhooks: IProbotWebhooks;
  auth: IProbotAuth;
}

struct PostCommentProps {
  environmentId: str;
}

inflight class ProbotAdapter {
  extern "./src/probot.mts" pub static inflight createProbot(appId: str, privateKey: str, webhookSecret: str): ProbotInstance;

  inflight var instance: ProbotInstance?;

  init() {
    this.instance = nil;
  }

  pub initialize(appId: str, privateKey: str, webhookSecret: str) {
    this.instance = ProbotAdapter.createProbot(appId, privateKey, webhookSecret);
  }

  pub handlePullRequstOpened(handler: inflight (probot.IPullRequestOpenedContext): void) {
    this.instance?.webhooks?.on("pull_request.opened", handler);
  }

  pub handlePullRequstReopened(handler: inflight (probot.IPullRequestOpenedContext): void) {
    this.instance?.webhooks?.on("pull_request.reopened", handler);
  }

  pub handlePullRequstSync(handler: inflight (probot.IPullRequestSyncContext): void) {
    this.instance?.webhooks?.on("pull_request.synchronize", handler);
  }

  pub handlePullRequstClosed(handler: inflight (probot.IPullRequestClosedContext): void) {
    this.instance?.webhooks?.on("pull_request.closed", handler);
  }

  pub verifyAndReceive(props: VerifyAndReceieveProps) {
    this.instance?.webhooks?.verifyAndReceive(props);
  }

  pub auth(installationId: num): octokit.OctoKit {
    if let kit = this.instance?.auth?.call(this.instance, installationId) {
      return kit;
    } else {
      throw "auth: fail to get octokit";
    }
  }
}

struct ProbotAppProps {
  runtimeUrl: str;
  runtimeCallbacks: runtime_callbacks.RuntimeCallbacks;
  probotAppId: str;
  probotSecretKey: str;
  webhookSecret: str;
  environments: environments.Environments;
  apps: apps.Apps;
}

pub class ProbotApp {
  probotAppId: str;
  probotSecretKey: str;
  webhookSecret: str;
  runtimeUrl: str;
  runtimeCallbacks: runtime_callbacks.RuntimeCallbacks;
  pub githubApp: github.GithubApp;
  inflight var adapter: ProbotAdapter;
  environments: environments.Environments;
  apps: apps.Apps;
  githubComment: comment.GithubComment;

  init(props: ProbotAppProps) {
    this.probotAppId =  props.probotAppId;
    this.probotSecretKey = props.probotSecretKey;
    this.webhookSecret = props.webhookSecret;
    this.runtimeUrl = props.runtimeUrl;
    this.runtimeCallbacks = props.runtimeCallbacks;
    this.environments = props.environments;
    this.apps = props.apps;
    this.githubComment = new comment.GithubComment(environments: props.environments, apps: props.apps);

    let queue = new cloud.Queue();
    this.githubApp = new github.GithubApp(
      this.probotAppId,
      this.probotSecretKey,
      inflight (req) => {
        queue.push(
          Json.stringify(this.getVerifyAndReceievePropsProps(req)),
        );
        return {
          status: 200
        };
      }
    );
    queue.setConsumer(inflight (message) => {
      log("receive message: ${message}");
      let props = VerifyAndReceieveProps.fromJson(Json.parse(message));
      this.listen();
      this.adapter.verifyAndReceive(props);
      }, { timeout: 1m });

    this.runtimeCallbacks.onStatus(inflight (event) => {
      log("report status: ${event}");
      let data = Json.parse(event);

      let statusReport = status_reports.StatusReport.fromJson(data);
      let environment = this.environments.get(id: statusReport.environmentId);
      let app = this.apps.get(appId: environment.appId);
      let status = statusReport.status;
      this.environments.updateStatus(id: environment.id, appId: environment.appId, status: status);
      if status == "tests" {
        this.environments.updateTestResults(
          id: environment.id,
          appId: app.appId,
          testResults: status_reports.TestStatusReport.fromJson(data)
        );
      }

      this.postComment(environmentId: environment.id);
    });
  }

  inflight getVerifyAndReceievePropsProps(req: cloud.ApiRequest): VerifyAndReceieveProps {
    let lowkeysHeaders = lowkeys.LowkeysMap.fromMap(req.headers ?? {});
    if !lowkeysHeaders.has("x-github-delivery") {
      throw "getVerifyProps: missing id header";
    }

    let id = lowkeysHeaders.get("x-github-delivery");

    if !lowkeysHeaders.has("x-github-event") {
      throw "getVerifyProps: missing name header";
    }

    let name = lowkeysHeaders.get("x-github-event");

    let signature = lowkeysHeaders.get("x-hub-signature-256");

    if let payload = req.body {
      return {
        id: id,
        name: name,
        signature: signature,
        payload: payload,
      };
    }

    throw "getVerifyProps: missing body";
  }

  inflight init() {
    this.adapter = new ProbotAdapter();
  }

  inflight listen() {
    this.adapter = new ProbotAdapter();
    this.adapter.initialize(this.probotAppId, this.probotSecretKey, this.webhookSecret);
    let onPullRequestOpen = inflight (context: probot.IPullRequestOpenedContext): void => {
      let branch = context.payload.pull_request.head.ref;

      let apps = this.apps.listByRepository(repository: context.payload.repository.full_name);
      for app in apps {
        if let installation = context.payload.installation {
          let environment = this.environments.create(
            branch: branch,
            appId: app.appId,
            repo: context.payload.repository.full_name,
            status: "initializing",
            installationId: installation.id,
            prNumber: context.payload.pull_request.number,
            prTitle: context.payload.pull_request.title,
          );

          this.postComment(environmentId: environment.id);

          let tokenRes = context.octokit.apps.createInstallationAccessToken(installation_id: environment.installationId);
          if tokenRes.status >= 300 || tokenRes.status < 200 {
            throw "handlePullRequstOpened: unable to create installtion access token";
          }

          let res = http.post(this.runtimeUrl, body: Json.stringify({
            repo: context.payload.repository.full_name,
            sha: context.payload.pull_request.head.sha,
            entryfile: app.entryfile,
            appId: app.appId,
            environmentId: environment.id,
            token: tokenRes.data.token,
          }));

          if !res.ok {
            throw "handlePullRequstOpened: runtime service error ${res.body}";
          }
        } else {
          throw "handlePullRequstOpened: missing installation id";
        }
      }
    };

    this.adapter.handlePullRequstOpened(inflight (context: probot.IPullRequestOpenedContext): void => {
      // TODO [sa] open a bug for this workaround
      onPullRequestOpen(context);
    });

    this.adapter.handlePullRequstReopened(inflight (context: probot.IPullRequestOpenedContext): void => {
      // TODO [sa] open a bug for this workaround
      onPullRequestOpen(context);
    });

    this.adapter.handlePullRequstClosed(inflight (context: probot.IPullRequestClosedContext): void => {
      let branch = context.payload.pull_request.head.ref;

      let apps = this.apps.listByRepository(repository: context.payload.repository.full_name);
      for app in apps {
        for environment in this.environments.list(appId: app.appId) {
          if environment.branch != branch || environment.status == "stopped" {
            continue;
          }

          this.environments.updateStatus(id: environment.id, appId: app.appId, status: "stopped");

          let res = http.delete(this.runtimeUrl, body: Json.stringify({
            environmentId: environment.id,
          }));

          if !res.ok {
            throw "handlePullRequstClosed: runtime service error ${res.body}";
          }

          this.postComment(environmentId: environment.id);
        }
      }
    });

    this.adapter.handlePullRequstSync(inflight (context: probot.IPullRequestSyncContext): void => {
      let branch = context.payload.pull_request.head.ref;

      let apps = this.apps.listByRepository(repository: context.payload.repository.full_name);
      for app in apps {
        for environment in this.environments.list(appId: app.appId) {
          if environment.branch != branch || environment.status == "stopped" {
            continue;
          }

          this.environments.updateStatus(id: environment.id, appId: app.appId, status: "initializing");

          this.postComment(environmentId: environment.id);

          let tokenRes = context.octokit.apps.createInstallationAccessToken(installation_id: environment.installationId);
          if tokenRes.status >= 300 || tokenRes.status < 200 {
            throw "handlePullRequstSync: unable to create installtion access token";
          }

          let res = http.post(this.runtimeUrl, body: Json.stringify({
            repo: context.payload.repository.full_name,
            sha: context.payload.pull_request.head.sha,
            entryfile: app.entryfile,
            environmentId: environment.id,
            token: tokenRes.data.token,
          }));

          if !res.ok {
            throw "handlePullRequstSync: runtime service error ${res.body}";
          }

          if let body = res.body {
            if let url = Json.tryParse(body)?.get("url")?.tryAsStr() {
              this.environments.updateUrl(id: environment.id, appId: app.appId, url: url);
              return;
            }
          }

          throw "handlePullRequstSync: invalid runtime service response ${res.body}";
        }
      }
    });
  }

  inflight postComment(props: PostCommentProps) {
    this.adapter = new ProbotAdapter();
    this.adapter.initialize(this.probotAppId, this.probotSecretKey, this.webhookSecret);
    let environment = this.environments.get(id: props.environmentId);
    let commentId = this.githubComment.createOrUpdate(
      octokit: this.adapter.auth(environment.installationId),
      prNumber: environment.prNumber,
      repo: environment.repo
    );

    if !environment.commentId? {
      this.environments.updateCommentId(id: environment.id, appId: environment.appId, commentId: commentId);
    }
  }
}
