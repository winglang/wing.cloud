bring "./environments.w" as environments;
bring "./apps.w" as apps;
bring "./github-comment.w" as comment;
bring "./types/octokit-types.w" as octokit;
bring "./runtime/runtime-client.w" as runtime_client;
bring "./probot-adapter.w" as adapter;
bring "./status-reports.w" as status_reports;

struct EnvironmentsProps {
  apps: apps.Apps;
  environments: environments.Environments;
  runtimeClient: runtime_client.RuntimeClient;
  probotAdapter: adapter.ProbotAdapter;
}

pub struct CreateEnvironmentOptions {
  createEnvironment: environments.CreateEnvironmentOptions;
  app: apps.App;
  sha: str;
}

pub struct RestartEnvironmentOptions {
  environment: environments.Environment;
  app: apps.App;
  sha: str;
}

pub struct RestartAllEnvironmentOptions {
  app: apps.App;
}

pub struct StopEnvironmentOptions {
  environment: environments.Environment;
  app: apps.App;
}

pub struct UpdateEnvironmentStatusOptions {
  statusReport: status_reports.StatusReport;
}

struct PostCommentOptions {
  environmentId: str;
  octokit: octokit.OctoKit;
}

pub class EnvironmentManager {
  apps: apps.Apps;
  environments: environments.Environments;
  githubComment: comment.GithubComment;
  runtimeClient: runtime_client.RuntimeClient;
  probotAdapter: adapter.ProbotAdapter;

  new(props: EnvironmentsProps) {
    this.apps = props.apps;
    this.environments = props.environments;
    this.runtimeClient = props.runtimeClient;
    this.probotAdapter = props.probotAdapter;
    this.githubComment = new comment.GithubComment(environments: props.environments, apps: props.apps);
  }

  pub inflight create(options: CreateEnvironmentOptions) {
    let octokit = this.auth(options.createEnvironment.installationId);

    let environment = this.environments.create(options.createEnvironment);

    this.postComment(environmentId: environment.id, octokit: octokit);

    let tokenRes = octokit.apps.createInstallationAccessToken(installation_id: environment.installationId);
    if tokenRes.status >= 300 || tokenRes.status < 200 {
      throw "environment create: unable to create installtion access token";
    }

    this.runtimeClient.create(
      app: options.app,
      environment: environment,
      sha: options.sha,
      token: tokenRes.data.token,
    );
  }

  pub inflight restart(options: RestartEnvironmentOptions) {
    let octokit = this.auth(options.environment.installationId);

    this.environments.updateStatus(id: options.environment.id, appId: options.app.appId, status: "initializing");

    this.postComment(environmentId: options.environment.id, octokit: octokit);

    let tokenRes = octokit.apps.createInstallationAccessToken(installation_id: options.environment.installationId);
    if tokenRes.status >= 300 || tokenRes.status < 200 {
      throw "environment restart: unable to create installtion access token";
    }

    this.runtimeClient.create(
      app: options.app,
      environment: options.environment,
      sha: options.sha,
      token: tokenRes.data.token,
    );
  }

  pub inflight restartAll(options: RestartAllEnvironmentOptions) {
    let environments = this.environments.list(appId: options.app.appId);
    for environment in environments {
      let octokit = this.auth(environment.installationId);
      let owner = environment.repo.split("/").at(0);
      let repo = environment.repo.split("/").at(1);
      let ref = octokit.git.getRef(owner: owner, repo: repo, ref: "heads/${environment.branch}");

      this.restart(app: options.app, environment: environment, sha: ref.data.object.sha);
    }
  }

  pub inflight stop(options: StopEnvironmentOptions) {
    let octokit = this.auth(options.environment.installationId);

    this.environments.updateStatus(id: options.environment.id, appId: options.app.appId, status: "stopped");

    this.runtimeClient.delete(environment: options.environment);

    this.postComment(environmentId: options.environment.id, octokit: octokit);
  }

  pub inflight updateStatus(options: UpdateEnvironmentStatusOptions) {
    let environment = this.environments.get(id: options.statusReport.environmentId);
    let app = this.apps.get(appId: environment.appId);
    let status = options.statusReport.status;
    this.environments.updateStatus(id: environment.id, appId: environment.appId, status: status);
    if status == "tests" {
      let testReport = status_reports.TestResults.fromJson(options.statusReport.data);
      this.environments.updateTestResults(
        id: environment.id,
        appId: app.appId,
        testResults: testReport
      );

      if testReport.testResults.length == 0 {
        return;
      }
    }

    let octokit = this.probotAdapter.auth(environment.installationId);
    this.postComment(environmentId: environment.id, octokit: octokit);
  }

  inflight postComment(props: PostCommentOptions) {
    let environment = this.environments.get(id: props.environmentId);
    if let prNumber = environment.prNumber {
      let commentId = this.githubComment.createOrUpdate(
        octokit: props.octokit,
        prNumber: prNumber,
        repo: environment.repo
      );

      if !environment.commentId? {
        this.environments.updateCommentId(id: environment.id, appId: environment.appId, commentId: commentId);
      }
    }
  }

  inflight auth(installationId: num): octokit.OctoKit {
    return this.probotAdapter.auth(installationId);
  }
}
