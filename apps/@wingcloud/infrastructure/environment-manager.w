bring ex;
bring cloud;
bring "./environments.w" as environments;
bring "./users.w" as users;
bring "./apps.w" as apps;
bring "./secrets.w" as secrets;
bring "./endpoints.w" as endpoints;
bring "./components/public-endpoint/public-endpoint.w" as publicEndpoint;
bring "./components/certificate/icertificate.w" as certificate;
bring "./github-comment.w" as comment;
bring "./types/octokit-types.w" as octokit;
bring "./runtime/runtime-client.w" as runtime_client;
bring "./probot-adapter.w" as adapter;
bring "./status-reports.w" as status_reports;
bring "./key-pair.w" as KeyPair;
bring "./segment-analytics.w" as analytics;
bring "./components/queues/most-recent-queue.w" as queue;

struct EnvironmentsProps {
  users: users.Users;
  apps: apps.Apps;
  secrets: secrets.Secrets;
  endpoints: endpoints.Endpoints;
  endpointProvider: publicEndpoint.PublicEndpointProvider;
  certificate: certificate.ICertificate;
  environments: environments.Environments;
  runtimeClient: runtime_client.RuntimeClient;
  probotAdapter: adapter.ProbotAdapter;
  siteDomain: str;
  analytics: analytics.SegmentAnalytics;
  logs: cloud.Bucket;
}

pub struct CreateEnvironmentOptions {
  createEnvironment: environments.EnvironmentOptions;
  appId: str;
  entrypoint: str;
  sha: str;
  owner: str;
  timestamp: num;
}

pub struct RestartEnvironmentOptions {
  environment: environments.Environment;
  appId: str;
  entrypoint: str;
  sha: str;
  timestamp: num;
}

pub struct RestartAllEnvironmentOptions {
  appId: str;
  entrypoint: str;
  timestamp: num;
}

pub struct StopEnvironmentOptions {
  appId: str;
  appName: str;
  environment: environments.Environment;
  timestamp: num;
  delete: bool;
}

pub struct UpdateEnvironmentStatusOptions {
  statusReport: status_reports.StatusReport;
}

struct QueueMessage {
  action: str;
  options: Json;
}

pub struct HandlerCreateEnvironmentOptions {
  appId: str;
  entrypoint: str;
  sha: str;
  environment: environments.Environment;
  privateKey: str;
}

struct PostCommentOptions {
  environmentId: str;
  octokit: octokit.OctoKit;
  appId: str;
  appName: str;
}

pub class EnvironmentManager {
  apps: apps.Apps;
  secrets: secrets.Secrets;
  environments: environments.Environments;
  endpoints: endpoints.Endpoints;
  endpointProvider: publicEndpoint.PublicEndpointProvider;
  certificate: certificate.ICertificate;
  githubComment: comment.GithubComment;
  runtimeClient: runtime_client.RuntimeClient;
  probotAdapter: adapter.ProbotAdapter;
  analytics: analytics.SegmentAnalytics;
  mrq: queue.MostRecentQueue;
  environmentEvents: cloud.Topic;
  endpointEvents: cloud.Topic;
  logs: cloud.Bucket;

  new(props: EnvironmentsProps) {
    this.apps = props.apps;
    this.secrets = props.secrets;
    this.environments = props.environments;
    this.endpoints = props.endpoints;
    this.endpointProvider = props.endpointProvider;
    this.certificate = props.certificate;
    this.runtimeClient = props.runtimeClient;
    this.probotAdapter = props.probotAdapter;
    this.logs = props.logs;

    this.environmentEvents = new cloud.Topic() as "environment creation events";
    this.endpointEvents = new cloud.Topic() as "endpoint creation events";

    this.githubComment = new comment.GithubComment(
      environments: props.environments,
      endpoints: props.endpoints,
      users: props.users,
      apps: props.apps,
      siteDomain: props.siteDomain
    );
    this.analytics = props.analytics;
    this.mrq = new queue.MostRecentQueue(handler: inflight (message) => {
      let body = QueueMessage.parseJson(message.body);
      this.handle(body);
    }) as "EnvironmentsMostRecent-Queue";
  }

  pub inflight handle(body: QueueMessage) {
    let action = body.action;
    try {
      if action == "create" {
        let options = HandlerCreateEnvironmentOptions.fromJson(body.options);
        if let app = this.apps.tryGet(appId: options.environment.appId) {
          this.handleCreate(options, app);
        }
      } elif action == "restart" {
        let options = RestartEnvironmentOptions.fromJson(body.options);
        if let app = this.apps.tryGet(appId: options.appId) {
          this.handleRestart(options, app);
        }
      } elif action == "stop" {
        let options = StopEnvironmentOptions.fromJson(body.options);
        this.handleStop(options);
      } elif action == "updateStatus" {
        let options = UpdateEnvironmentStatusOptions.fromJson(body.options);
        let environment = this.environments.get(id: options.statusReport.environmentId);
        if let app = this.apps.tryGet(appId: environment.appId) {
          this.handleUpdateStatus(options, app, environment);
        }
      } else {
        log("unknown action {action}");
      }
    } catch err {
      log("Failed to handle action {action}: {err}");
    }
  }

  pub inflight handleCreate(options: HandlerCreateEnvironmentOptions, app: apps.App) {
    let octokit = this.auth(options.environment.installationId);

    let secrets = this.secretsForEnvironment(options.environment);

    this.postComment(
      appId: app.appId,
      appName: app.appName,
      environmentId: options.environment.id,
      octokit: octokit
    );

    if options.environment.type == "production" {
      try {
        this.githubComment.updateRepoInfo(
          octokit: octokit,
          appId: options.appId,
          appName: app.appName,
          environmentId: options.environment.id,
        );
      } catch err {
        log("unable to update repo url: {err}");
      }
    }

    let tokenRes = octokit.apps.createInstallationAccessToken(installation_id: options.environment.installationId);
    if tokenRes.status >= 300 || tokenRes.status < 200 {
      throw "environment create: unable to create installation access token";
    }

    this.runtimeClient.create(
      appId: options.appId,
      entrypoint: options.entrypoint,
      environment: options.environment,
      secrets: secrets,
      certificate: this.certificate.certificate(),
      sha: options.sha,
      token: tokenRes.data.token,
      privateKey: options.privateKey,
    );
  }

  pub inflight create(options: CreateEnvironmentOptions) {
    let octokit = this.auth(options.createEnvironment.installationId);

    let keyPair = KeyPair.KeyPair.generate();

    let item = MutJson(options.createEnvironment);
    item.set("publicKey", keyPair.publicKey);

    let environment = this.environments.create(
      environments.CreateEnvironmentOptions.fromJson(item)
    );

    this.analytics.track(options.owner, "cloud_environment_created", {
      branch: environment.branch,
      repo: environment.repo,
      type: environment.type,
    });

    this.mrq.enqueue(
      groupId: environment.id,
      timestamp: options.timestamp,
      body: Json.stringify(QueueMessage{
        action: "create",
        options: HandlerCreateEnvironmentOptions{
          appId: options.appId,
          entrypoint: options.entrypoint,
          environment: environment,
          sha: options.sha,
          privateKey: keyPair.privateKey,
        }
      })
    );

    this.environmentEvents.publish(Json.stringify(environment));
  }

  pub inflight handleRestart(options: RestartEnvironmentOptions, app: apps.App) {
    let octokit = this.auth(options.environment.installationId);
    let keyPair = KeyPair.KeyPair.generate();

    this.environments.updateSha(
      id: options.environment.id,
      appId: options.appId,
      sha: options.sha
    );

    this.environments.updatePublicKey(
      id: options.environment.id,
      appId: options.appId,
      publicKey: keyPair.publicKey
    );

    this.environments.updateStatus(
      id: options.environment.id,
      appId: options.appId,
      status: "initializing"
    );

    this.clearEnvironmentData(options.environment);
    this.environmentEvents.publish(Json.stringify(options.environment));

    let secrets = this.secretsForEnvironment(options.environment);

    this.postComment(
      appId: app.appId,
      appName: app.appName,
      environmentId: options.environment.id,
      octokit: octokit
    );

    let tokenRes = octokit.apps.createInstallationAccessToken(installation_id: options.environment.installationId);
    if tokenRes.status >= 300 || tokenRes.status < 200 {
      throw "environment restart: unable to create installtion access token";
    }

    this.runtimeClient.create(
      appId: options.appId,
      entrypoint: options.entrypoint,
      environment: options.environment,
      secrets: secrets,
      certificate: this.certificate.certificate(),
      sha: options.sha,
      token: tokenRes.data.token,
      privateKey: keyPair.privateKey,
    );
  }

  pub inflight restart(options: RestartEnvironmentOptions) {
    this.mrq.enqueue(
      groupId: options.environment.id,
      timestamp: options.timestamp,
      body: Json.stringify(QueueMessage{
        action: "restart",
        options: options,
      })
    );
  }

  pub inflight restartAll(options: RestartAllEnvironmentOptions) {
    let environments = this.environments.list(appId: options.appId);
    for environment in environments {
      let octokit = this.auth(environment.installationId);
      let owner = environment.repo.split("/").at(0);
      let repo = environment.repo.split("/").at(1);
      let ref = octokit.git.getRef(owner: owner, repo: repo, ref: "heads/{environment.branch}");

      this.restart(
        appId: options.appId,
        entrypoint: options.entrypoint,
        environment: environment,
        sha: ref.data.object.sha,
        timestamp: options.timestamp,
      );
    }
  }

  pub inflight handleStop(options: StopEnvironmentOptions) {
    let octokit = this.auth(options.environment.installationId);

    let status = "stopped";

    this.clearEnvironmentData(options.environment);
    this.environments.updateStatus(id: options.environment.id, appId: options.appId, status: status);

    this.environmentEvents.publish(Json.stringify(options.environment));

    this.runtimeClient.delete(environment: options.environment);

    for endpoint in this.endpoints.list(environmentId: options.environment.id) {
      this.endpointProvider.from(
        digest: endpoint.digest,
        port: endpoint.port,
        targetUrl: "{options.environment.url}").delete();
    }

    this.postComment(
      environmentId: options.environment.id,
      octokit: octokit,
      appId: options.appId,
      appName: options.appName,
    );

    if options.delete {
      this.environments.delete(
        appId: options.appId,
        environmentId: options.environment.id
      );
    }
  }

  pub inflight stop(options: StopEnvironmentOptions) {
    this.mrq.enqueue(
      groupId: options.environment.id,
      timestamp: options.timestamp,
      body: Json.stringify(QueueMessage{
        action: "stop",
        options: options,
      })
    );
  }

  pub inflight handleUpdateStatus(options: UpdateEnvironmentStatusOptions, app: apps.App, environment: environments.Environment) {
    try {
      let status = options.statusReport.status;
      let data = options.statusReport.data;
      let octokit = this.probotAdapter.auth(environment.installationId);

      let ref = octokit.git.getRef(
        owner: environment.repo.split("/").at(0),
        repo: environment.repo.split("/").at(1),
        ref: "heads/{environment.branch}"
      );

      // if the environment build has completed, check to see if there is a new commit
      if status == "running" || status == "error" && environment.status != "stopped" {
        if environment.sha != ref.data.object.sha {
          this.restart(
            appId: app.appId,
            entrypoint: app.entrypoint,
            environment: environment,
            sha: ref.data.object.sha,
            timestamp: datetime.utcNow().timestampMs,
          );
          return;
        }
      }

      this.environments.updateStatus(
        id: environment.id,
        appId: environment.appId,
        status: status
      );

      this.environmentEvents.publish(Json.stringify(environment));

      if status == "running" {
        let running = status_reports.Running.fromJson(options.statusReport.data);
        this.reconcileEndpoints(environment, running.objects.endpoints);
      }

      this.postComment(
        appId: app.appId,
        appName: app.appName,
        environmentId: environment.id,
        octokit: octokit
      );
    } catch err {
      log("Ignoring status update for a deleted app {environment.appId}");
    }
  }

  pub inflight updateStatus(options: UpdateEnvironmentStatusOptions) {
    let environment = this.environments.get(id: options.statusReport.environmentId);
    if options.statusReport.status == "running-server" {
      let testReport = status_reports.TestResults.fromJson(options.statusReport.data);
      this.environments.updateTestResults(
        id: environment.id,
        appId: environment.appId,
        testResults: testReport
      );
    }

    this.mrq.enqueue(
      groupId: options.statusReport.environmentId,
      timestamp: options.statusReport.timestamp,
      body: Json.stringify(QueueMessage{
        action: "updateStatus",
        options: options,
      })
    );
  }

  pub onEnvironmentChange(handler: inflight (environments.Environment): void) {
    this.environmentEvents.onMessage(inflight (event) => {
      let environment = environments.Environment.fromJson(Json.parse(event));
      handler(environment);
    });
  }

  pub onEndpointChange(handler: inflight (endpoints.Endpoint): void) {
    this.endpointEvents.onMessage(inflight (event) => {
      let endpoint = endpoints.Endpoint.fromJson(Json.parse(event));
      handler(endpoint);
    });
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
    let secrets = this.secrets.list(
      appId: environment.appId,
      environmentType: environment.type,
      decryptValues: true
    );
    for secret in secrets {
      map.set(secret.name, secret.value);
    }
    return map.copy();
  }

  inflight reconcileEndpoints(environment: environments.Environment, endpoints: Array<status_reports.Endpoint>) {
    if let url = environment.url {
      let existingEndpoints = this.endpoints.list(environmentId: environment.id);
      for endpoint in endpoints {
        let publicEndpoint = this.endpointProvider.from(
          digest: endpoint.digest,
          port: endpoint.port,
          targetUrl: url);


        // check if we already created this public endpoint
        let var found = false;
        for existingEndpoint in existingEndpoints {
          if existingEndpoint.publicUrl == publicEndpoint.url() {
            found = true;
            break;
          }
        }

        if found {
          continue;
        }

        log("creating endpoint {Json.stringify(endpoint)}");
        publicEndpoint.create();
        let newEndpoint = this.endpoints.create(
          appId: environment.appId,
          environmentId: environment.id,
          path: endpoint.path,
          label: endpoint.label,
          browserSupport: endpoint.browserSupport,
          localUrl: endpoint.url,
          publicUrl: publicEndpoint.url(),
          port: endpoint.port,
          digest: endpoint.digest,
        );
        this.endpointEvents.publish(Json.stringify(newEndpoint));
      }

      // public endpoints needs to be deleted when they no longer appear in the environment
      for existingEndpoint in existingEndpoints {
        let var found = false;
        for endpoint in endpoints {
          let publicEndpoint = this.endpointProvider.from(
            digest: endpoint.digest,
            port: endpoint.port,
            targetUrl: url);
          if existingEndpoint.publicUrl == publicEndpoint.url() {
            found = true;
            break;
          }
        }

        if found {
          continue;
        }

        let publicEndpoint = this.endpointProvider.from(
          digest: existingEndpoint.digest,
          port: existingEndpoint.port,
          targetUrl: url);
        log("deleting endpoint {Json.stringify(publicEndpoint)}");
        publicEndpoint.delete();
        this.endpoints.delete(id: existingEndpoint.id, environmentId: existingEndpoint.environmentId);
      }
    }
  }

  pub inflight clearEnvironmentData(environment: environments.Environment) {
    this.environments.clearTestResults(id: environment.id, appId: environment.appId);

    this.logs.tryDelete("{environment.id}/deployment.log");
    this.logs.tryDelete("{environment.id}/runtime.log");
    let testEntries = this.logs.list("{environment.id}/tests");
    for entry in testEntries {
      this.logs.tryDelete(entry);
    }
  }
}
