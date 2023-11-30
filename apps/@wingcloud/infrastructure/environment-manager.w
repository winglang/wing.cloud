bring "./environments.w" as environments;
bring "./apps.w" as apps;
bring "./secrets.w" as secrets;
bring "./github-comment.w" as comment;
bring "./types/octokit-types.w" as octokit;
bring "./runtime/runtime-client.w" as runtime_client;
bring "./probot-adapter.w" as adapter;
bring "./status-reports.w" as status_reports;

struct EnvironmentsProps {
  apps: apps.Apps;
  secrets: secrets.Secrets;
  environments: environments.Environments;
  runtimeClient: runtime_client.RuntimeClient;
  probotAdapter: adapter.ProbotAdapter;
  siteDomain: str;
}

pub struct CreateEnvironmentOptions {
  createEnvironment: environments.CreateEnvironmentOptions;
  appId: str;
  entryfile: str;
  sha: str;
}

pub struct RestartEnvironmentOptions {
  environment: environments.Environment;
  appId: str;
  entryfile: str;
  sha: str;
}

pub struct RestartAllEnvironmentOptions {
  appId: str;
  entryfile: str;
}

pub struct StopEnvironmentOptions {
  appId: str;
  appName: str;
  repoOwner: str;
  environment: environments.Environment;
}

pub struct UpdateEnvironmentStatusOptions {
  statusReport: status_reports.StatusReport;
}

struct PostCommentOptions {
  environmentId: str;
  octokit: octokit.OctoKit;
  appId: str;
  appName: str;
  repoOwner: str;
}

pub class EnvironmentManager {
  apps: apps.Apps;
  secrets: secrets.Secrets;
  environments: environments.Environments;
  githubComment: comment.GithubComment;
  runtimeClient: runtime_client.RuntimeClient;
  probotAdapter: adapter.ProbotAdapter;

  new(props: EnvironmentsProps) {
    this.apps = props.apps;
    this.secrets = props.secrets;
    this.environments = props.environments;
    this.runtimeClient = props.runtimeClient;
    this.probotAdapter = props.probotAdapter;
    this.githubComment = new comment.GithubComment(environments: props.environments, apps: props.apps, siteDomain: props.siteDomain);
  }

  pub inflight create(options: CreateEnvironmentOptions) {
    let octokit = this.auth(options.createEnvironment.installationId);

    let environment = this.environments.create(options.createEnvironment);

    let secrets = this.secretsForEnvironment(environment);

    let app = this.apps.get(appId: environment.appId);

    this.postComment(
      appId: app.appId,
      appName: app.appName,
      repoOwner: app.repoOwner,
      environmentId: environment.id,
      octokit: octokit
    );

    let tokenRes = octokit.apps.createInstallationAccessToken(installation_id: environment.installationId);
    if tokenRes.status >= 300 || tokenRes.status < 200 {
      throw "environment create: unable to create installtion access token";
    }

    this.runtimeClient.create(
      appId: options.appId,
      entryfile: options.entryfile,
      environment: environment,
      secrets: secrets,
      sha: options.sha,
      token: tokenRes.data.token,
    );
  }

  pub inflight restart(options: RestartEnvironmentOptions) {
    let octokit = this.auth(options.environment.installationId);

    this.environments.updateStatus(id: options.environment.id, appId: options.appId, status: "initializing");

    let secrets = this.secretsForEnvironment(options.environment);

    let app = this.apps.get(appId: options.appId);

    this.postComment(
      appId: app.appId,
      appName: app.appName,
      repoOwner: app.repoOwner,
      environmentId: options.environment.id,
      octokit: octokit
    );

    let tokenRes = octokit.apps.createInstallationAccessToken(installation_id: options.environment.installationId);
    if tokenRes.status >= 300 || tokenRes.status < 200 {
      throw "environment restart: unable to create installtion access token";
    }

    this.runtimeClient.create(
      appId: options.appId,
      entryfile: options.entryfile,
      environment: options.environment,
      secrets: secrets,
      sha: options.sha,
      token: tokenRes.data.token,
    );
  }

  pub inflight restartAll(options: RestartAllEnvironmentOptions) {
    let environments = this.environments.list(appId: options.appId);
    for environment in environments {
      let octokit = this.auth(environment.installationId);
      let owner = environment.repo.split("/").at(0);
      let repo = environment.repo.split("/").at(1);
      let ref = octokit.git.getRef(owner: owner, repo: repo, ref: "heads/{environment.branch}");

      this.restart(appId: options.appId, entryfile: options.entryfile, environment: environment, sha: ref.data.object.sha);
    }
  }

  pub inflight stop(options: StopEnvironmentOptions) {
    let octokit = this.auth(options.environment.installationId);

    this.environments.updateStatus(id: options.environment.id, appId: options.appId, status: "stopped");

    this.runtimeClient.delete(environment: options.environment);

    this.postComment(
      environmentId: options.environment.id,
      octokit: octokit,
      appId: options.appId,
      appName: options.appName,
      repoOwner: options.repoOwner
    );
  }

  pub inflight updateStatus(options: UpdateEnvironmentStatusOptions) {
    let environment = this.environments.get(id: options.statusReport.environmentId);
    let app = this.apps.get(appId: environment.appId);
    let status = options.statusReport.status;
    let data = options.statusReport.data;

    this.environments.updateStatus(
      id: environment.id,
      appId: environment.appId,
      status: status
    );

    if status == "tests" {
      let testReport = status_reports.TestResults.fromJson(data);
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

    this.postComment(
      appId: app.appId,
      appName: app.appName,
      repoOwner: app.repoOwner,
      environmentId: environment.id,
      octokit: octokit
    );
  }

  inflight postComment(props: PostCommentOptions) {
    let environment = this.environments.get(id: props.environmentId);
    if let prNumber = environment.prNumber {
      let commentId = this.githubComment.createOrUpdate(
        octokit: props.octokit,
        prNumber: prNumber,
        repo: environment.repo,
        appId: props.appId,
        appName: props.appName,
        repoOwner: props.repoOwner,
      );

      if !environment.commentId? {
        this.environments.updateCommentId(id: environment.id, appId: environment.appId, commentId: commentId);
      }
    }
  }

  inflight auth(installationId: num): octokit.OctoKit {
    return this.probotAdapter.auth(installationId);
  }

  inflight secretsForEnvironment(environment: environments.Environment): Map<str> {
    let map = MutMap<str>{};
    let secrets = this.secrets.list(appId: environment.appId, environmentType: environment.type, decryptValues: true);
    for secret in secrets {
      map.set(secret.name, secret.value);
    }
    return map.copy();
  }
}
