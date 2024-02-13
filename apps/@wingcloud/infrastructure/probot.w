bring cloud;
bring http;
bring ex;
bring util;
bring "./types/probot-types.w" as probot;
bring "./types/octokit-types.w" as octokit;
bring "./probot-adapter.w" as adapter;
bring "./lowkeys-map.w" as lowkeys;
bring "./github-app.w" as github;
bring "./environments.w" as environments;
bring "./environment-manager.w" as environment_manager;
bring "./users.w" as users;
bring "./apps.w" as apps;
bring "./status-reports.w" as status_reports;

struct PostCommentProps {
  environmentId: str;
}

struct ProbotAppProps {
  probotAdapter: adapter.ProbotAdapter;
  environments: environments.Environments;
  environmentManager: environment_manager.EnvironmentManager;
  users: users.Users;
  apps: apps.Apps;
  siteDomain: str;
}

pub class ProbotApp {
  adapter: adapter.ProbotAdapter;
  pub githubApp: github.GithubApp;
  environments: environments.Environments;
  environmentManager: environment_manager.EnvironmentManager;
  apps: apps.Apps;

  new(props: ProbotAppProps) {
    this.adapter = props.probotAdapter;
    this.environments = props.environments;
    this.environmentManager = props.environmentManager;
    this.apps = props.apps;

    let queue = new cloud.Queue(timeout: 6m) as "Probot app";
    this.githubApp = new github.GithubApp(
      this.adapter.appId,
      this.adapter.secretKey,
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
      log("receive message: {message}");
      let props = probot.VerifyAndReceieveProps.fromJson(Json.parse(message));
      this.listen(props);
    });
  }

  inflight getVerifyAndReceievePropsProps(req: cloud.ApiRequest): probot.VerifyAndReceieveProps {
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

  inflight listen(props: probot.VerifyAndReceieveProps) {
    let onPullRequestOpen = inflight (context: probot.IPullRequestOpenedContext): void => {
      let branch = context.payload.pull_request.head.ref;

      let apps = this.apps.listByRepository(repository: context.payload.repository.full_name);
      for app in apps {
        if let installation = context.payload.installation {
          let time = datetime.fromIso(context.payload.pull_request.updated_at ?? datetime.utcNow().toIso());
          this.environmentManager.create(
            createEnvironment: {
              branch: branch,
              sha: context.payload.pull_request.head.sha,
              appId: app.appId,
              type: "preview",
              repo: context.payload.repository.full_name,
              status: "initializing",
              installationId: installation.id,
              prNumber: context.payload.pull_request.number,
              prTitle: context.payload.pull_request.title,
            },
            owner: context.payload.repository.owner.login,
            appId: app.appId,
            entrypoint: app.entrypoint,
            sha: context.payload.pull_request.head.sha,
            timestamp: time.timestampMs,
          );
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

          let time = datetime.fromIso(context.payload.pull_request.closed_at ?? datetime.utcNow().toIso());
          this.environmentManager.stop(
            appId: app.appId,
            appName: app.appName,
            environment: environment,
            timestamp: time.timestampMs,
            delete: false,
          );
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

          this.environmentManager.restart(
            environment: environment,
            appId: app.appId,
            entrypoint: app.entrypoint,
            sha: context.payload.pull_request.head.sha,
            timestamp: datetime.utcNow().timestampMs,
          );
        }
      }
    });

    this.adapter.handlePush(inflight (context: probot.IPushContext) => {
      let branch = context.payload.ref.replace("refs/heads/", "");

      let apps = this.apps.listByRepository(repository: context.payload.repository.full_name);
      for app in apps {
        for environment in this.environments.list(appId: app.appId) {
          if environment.branch != branch || environment.status == "stopped" || environment.type != "production" {
            continue;
          }

          this.apps.updatLastCommit(
            appId: app.appId,
            appName: app.appName,
            repoId: app.repoId,
            userId: app.userId,
            lastCommitMessage: context.payload.head_commit.message,
            lastCommitSha: context.payload.after,
            lastCommitDate: context.payload.head_commit.committer.date ?? "",
          );

          this.environmentManager.restart(
            environment: environment,
            appId: app.appId,
            entrypoint: app.entrypoint,
            sha: context.payload.after,
            timestamp: datetime.utcNow().timestampMs,
          );
        }
      }
    });

    this.adapter.verifyAndReceive(props);
  }
}
