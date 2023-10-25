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
bring "./projects.w" as projects;

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

struct TestResult {
  path: str;
  pass: bool;
}

struct TestResults {
  testResults: Array<TestResult>;
}

struct StatusReport {
  environmentId: str;
  status: str;
}

struct TestStatusReport extends StatusReport {
  data: TestResults;
}

struct PostCommentProps {
  data: Json;
  statusReport: StatusReport;
  environment: environments.Environment;
  project: projects.Project;
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
  projects: projects.Projects;
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
  projects: projects.Projects;

  init(props: ProbotAppProps) {
    this.probotAppId =  props.probotAppId;
    this.probotSecretKey = props.probotSecretKey;
    this.webhookSecret = props.webhookSecret;
    this.runtimeUrl = props.runtimeUrl;
    this.runtimeCallbacks = props.runtimeCallbacks;
    this.environments = props.environments;
    this.projects = props.projects;

    this.githubApp = new github.GithubApp(
      this.probotAppId,
      this.probotSecretKey,
      inflight (req) => {
        this.listen();
        this.adapter.verifyAndReceive(this.getVerifyAndReceievePropsProps(req));
        return {
          status: 200
        };
      }
    );

    this.runtimeCallbacks.onStatus(inflight (event) => {
      log("report status: ${event}");
      let data = Json.parse(event);

      let statusReport = StatusReport.fromJson(data);
      let environment = this.environments.get(id: statusReport.environmentId);
      let project = this.projects.get(id: environment.projectId);
      let status = statusReport.status;
      this.environments.updateStatus(id: environment.id, projectId: environment.projectId, status: status);
      
      this.postComment(data: data, statusReport: statusReport, environment: environment, project: project);
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
      let owner = context.payload.repository.owner.login;
      let repo = context.payload.repository.name;
      let branch = context.payload.pull_request.head.ref;

      let projects = this.projects.listByRepository(repository: context.payload.repository.id);
      for project in projects {
        if let installation = context.payload.installation {
          let environment = this.environments.create(
            branch: branch,
            projectId: project.id, 
            repo: "${owner}/${repo}",
            status: "initializing",
            installationId: installation.id,
            prNumber: context.payload.pull_request.number,
          );

          let res = http.post(this.runtimeUrl, body: Json.stringify({
            repo: "${owner}/${repo}",
            sha: context.payload.pull_request.head.sha,
            entryfile: project.entryfile,
            environmentId: environment.id,
          }));
          
          if !res.ok {
            throw "handlePullRequstOpened: runtime service error ${res.body}";
          }

          if let body = res.body {
            if let url = Json.tryParse(body)?.get("url")?.tryAsStr() {
              this.environments.updateUrl(id: environment.id, projectId: project.id, url: url);
              return;
            }
          }

          throw "handlePullRequstOpened: invalid runtime service response ${res.body}";
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
      let owner = context.payload.repository.owner.login;
      let repo = context.payload.repository.name;
      let branch = context.payload.pull_request.head.ref;

      let projects = this.projects.listByRepository(repository: context.payload.repository.id);
      for project in projects {
        for environment in this.environments.list(projectId: project.id) {
          if environment.branch != branch || environment.status == "stopped" {
            continue;
          }

          this.environments.updateStatus(id: environment.id, projectId: project.id, status: "stopped");

          let res = http.delete(this.runtimeUrl, body: Json.stringify({
            environmentId: environment.id,
          }));

          if !res.ok {
            throw "handlePullRequstClosed: runtime service error ${res.body}";
          }
        }
      }
    });

    this.adapter.handlePullRequstSync(inflight (context: probot.IPullRequestSyncContext): void => {
      let owner = context.payload.repository.owner.login;
      let repo = context.payload.repository.name;
      let branch = context.payload.pull_request.head.ref;

      let projects = this.projects.listByRepository(repository: context.payload.repository.id);
      for project in projects {
        for environment in this.environments.list(projectId: project.id) {
          if environment.branch != branch || environment.status == "stopped" {
            continue;
          }

          this.environments.updateStatus(id: environment.id, projectId: project.id, status: "initializing");

          let res = http.post(this.runtimeUrl, body: Json.stringify({
            repo: "${owner}/${repo}",
            sha: context.payload.pull_request.head.sha,
            entryfile: project.entryfile,
            environmentId: environment.id,
          }));

          if !res.ok {
            throw "handlePullRequstSync: runtime service error ${res.body}";
          }
  
          if let body = res.body {
            if let url = Json.tryParse(body)?.get("url")?.tryAsStr() {
              this.environments.updateUrl(id: environment.id, projectId: project.id, url: url);
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

    let owner = props.environment.repo.split("/").at(0);
    let repo = props.environment.repo.split("/").at(1);
    let status = props.statusReport.status;

    let var testsString = "---";
    if status == "tests" {
      let testStatusReport = TestStatusReport.fromJson(props.data);
      testsString = "";
      let var i = 0;
      for testResult in testStatusReport.data.testResults {
        let var icon = "✅";
        if !testResult.pass {
          icon = "❌";
        }
        testsString = "${icon} ${testResult.path}<br> ${testsString}";
        i += 1;
      }
    }

    let var previewUrl = "";
    let shouldDisplayUrl = status == "running";
    if(shouldDisplayUrl) {
      previewUrl = props.environment.url ?? "";
    }

    let date = std.Datetime.utcNow().toIso();
    let tableRows = "| ${props.project.entryfile} | ${status} | ${previewUrl} | ${testsString} | ${date} |";
    let commentBody = "
| Entry Point     | Status | Preview | Tests | Updated (UTC) |
| --------------- | ------ | ------- | ----- | -------------- |
${tableRows}
";
    if let commentId = props.environment.commentId {
      log("updating existing preview comment: ${commentId}");
      this.adapter.auth(props.environment.installationId).issues.updateComment(
        owner: owner,
        repo: repo,
        comment_id: commentId,
        body: commentBody
      );
    } else {
      log("creating a new preview comment");
      let res = this.adapter.auth(props.environment.installationId).issues.createComment(
        owner: owner,
        repo: repo,
        issue_number: props.environment.prNumber,
        body: commentBody
      );
      log("created preview comment id: ${res.data.id}");
      this.environments.updateCommentId(id: props.environment.id, projectId: props.environment.projectId, commentId: res.data.id);
    }
  }
}
