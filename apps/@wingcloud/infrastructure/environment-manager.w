bring "./environments.w" as environments;
bring "./apps.w" as apps;
bring "./secrets.w" as secrets;
bring "./endpoints.w" as endpoints;
bring "./components/endpoint/endpoint.w" as endpoint;
bring "./github-comment.w" as comment;
bring "./types/octokit-types.w" as octokit;
bring "./runtime/runtime-client.w" as runtime_client;
bring "./probot-adapter.w" as adapter;
bring "./status-reports.w" as status_reports;

struct EnvironmentsProps {
  apps: apps.Apps;
  secrets: secrets.Secrets;
  endpoints: endpoints.Endpoints;
  endpoint: endpoint.Endpoint;
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
  secrets: secrets.Secrets;
  environments: environments.Environments;
  endpoints: endpoints.Endpoints;
  endpoint: endpoint.Endpoint;
  githubComment: comment.GithubComment;
  runtimeClient: runtime_client.RuntimeClient;
  probotAdapter: adapter.ProbotAdapter;

  new(props: EnvironmentsProps) {
    this.apps = props.apps;
    this.secrets = props.secrets;
    this.environments = props.environments;
    this.endpoints = props.endpoints;
    this.endpoint = props.endpoint;
    this.runtimeClient = props.runtimeClient;
    this.probotAdapter = props.probotAdapter;
    this.githubComment = new comment.GithubComment(environments: props.environments, apps: props.apps);
  }

  pub inflight create(options: CreateEnvironmentOptions) {
    let octokit = this.auth(options.createEnvironment.installationId);

    let environment = this.environments.create(options.createEnvironment);

    let secrets = this.secretsForEnvironment(environment);

    this.postComment(environmentId: environment.id, octokit: octokit);

    let tokenRes = octokit.apps.createInstallationAccessToken(installation_id: environment.installationId);
    if tokenRes.status >= 300 || tokenRes.status < 200 {
      throw "environment create: unable to create installtion access token";
    }

    this.runtimeClient.create(
      app: options.app,
      environment: environment,
      secrets: secrets,
      sha: options.sha,
      token: tokenRes.data.token,
    );
  }

  pub inflight restart(options: RestartEnvironmentOptions) {
    let octokit = this.auth(options.environment.installationId);

    this.environments.updateStatus(id: options.environment.id, appId: options.app.appId, status: "initializing");

    let secrets = this.secretsForEnvironment(options.environment);

    this.postComment(environmentId: options.environment.id, octokit: octokit);

    let tokenRes = octokit.apps.createInstallationAccessToken(installation_id: options.environment.installationId);
    if tokenRes.status >= 300 || tokenRes.status < 200 {
      throw "environment restart: unable to create installtion access token";
    }

    this.runtimeClient.create(
      app: options.app,
      environment: options.environment,
      secrets: secrets,
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

    for endpoint in this.endpoints.list(environmentId: options.environment.id) {
      this.endpoint.delete(endpoint);
    }

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
    } elif status == "running" {
      let running = status_reports.Running.fromJson(options.statusReport.data);
      for endpoint in running.objects.endpoints {
        if let url = environment.url {
          log("creating endpoint ${Json.stringify(endpoint)}");
          let endpointUrl = this.endpoint.create(url, endpoint);
          this.endpoints.create(
            appId: environment.appId,
            environmentId: environment.id,
            runId: environment.runId,
            path: endpoint.path,
            type: endpoint.type,
            localUrl: endpoint.url,
            publicUrl: endpointUrl,
            port: endpoint.port,
            digest: endpoint.digest,
          );
        }
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

  inflight secretsForEnvironment(environment: environments.Environment): Map<str> {
    let map = MutMap<str>{};
    let secrets = this.secrets.list(appId: environment.appId, environmentType: environment.type, decryptValues: true);
    for secret in secrets {
      map.set(secret.name, secret.value);
    }
    return map.copy();
  }
}
