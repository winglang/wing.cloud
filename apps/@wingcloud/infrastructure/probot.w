bring cloud;
bring http;
bring ex;
bring util;
bring "cdktf" as cdktf;
bring "./types/probot-types.w" as probot;
bring "./types/octokit-types.w" as octokit;
bring "./probot-adapter.w" as adapter;
bring "./environments.w" as environments;
bring "./environment-manager.w" as environment_manager;
bring "./users.w" as users;
bring "./apps.w" as apps;
bring "./status-reports.w" as status_reports;

struct PostCommentProps {
  environmentId: str;
}

struct ProbotAppProps {
  runtimeUrl: str;
  environments: environments.Environments;
  environmentManager: environment_manager.EnvironmentManager;
  users: users.Users;
  apps: apps.Apps;
  siteDomain: str;
}

pub class ProbotApp {
  adapter: adapter.ProbotAdapter;
  runtimeUrl: str;
  environments: environments.Environments;
  environmentManager: environment_manager.EnvironmentManager;
  apps: apps.Apps;

  new(props: ProbotAppProps) {
    this.adapter = new adapter.ProbotAdapter();
    this.runtimeUrl = props.runtimeUrl;
    this.environments = props.environments;
    this.environmentManager = props.environmentManager;
    this.apps = props.apps;
  }

  // this should emit doimain specific events, rather
  // than doing all the work here
  pub inflight listen(props: probot.VerifyAndReceieveProps) {
    let onPullRequestOpen = inflight (context: probot.IPullRequestOpenedContext): void => {
      let branch = context.payload.pull_request.head.ref;

      let apps = this.apps.listByRepository(repository: context.payload.repository.full_name);
      for app in apps {
        if let installation = context.payload.installation {
          this.environmentManager.create(
            createEnvironment: {
              branch: branch,
              appId: app.appId,
              type: "preview",
              repo: context.payload.repository.full_name,
              status: "initializing",
              installationId: installation.id,
              prNumber: context.payload.pull_request.number,
              prTitle: context.payload.pull_request.title,
            },
            appId: app.appId,
            entrypoint: app.entrypoint,
            sha: context.payload.pull_request.head.sha,
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

          this.environmentManager.stop(
            appId: app.appId,
            appName: app.appName,
            environment: environment,
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

          this.environmentManager.restart(
            environment: environment,
            appId: app.appId,
            entrypoint: app.entrypoint,
            sha: context.payload.after,
          );
        }
      }
    });

    this.adapter.verifyAndReceive(props);
  }
}
