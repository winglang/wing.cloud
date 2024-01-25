bring cloud;
bring http;
bring ex;
bring util;
bring fs;

bring "./json-api.w" as json_api;
bring "./cookie.w" as Cookie;
bring "./github-tokens-table.w" as github_tokens_table;
bring "./github.w" as GitHub;
bring "./jwt.w" as JWT;
bring "./key-pair.w" as KeyPair;
bring "./apps.w" as Apps;
bring "./users.w" as Users;
bring "./environments.w" as Environments;
bring "./secrets.w" as Secrets;
bring "./endpoints.w" as Endpoints;
bring "./lowkeys-map.w" as lowkeys;
bring "./http-error.w" as httpError;
bring "./websockets.w" as websockets;
bring "./invalidate-query.w" as InvalidateQuery;

struct Log {
  message: str;
  timestamp: str;
}

struct TestLog {
  id: str;
  path: str;
  pass: bool;
  error: str?;
  timestamp: str;
  time: num;
  traces: Array<Log>;
}

struct UserFromCookie {
  userId: str;
  username: str;
}

struct DeleteAppMessage {
  appId: str;
  appName: str;
  userId: str;
  timestamp: num;
}

struct CreateProductionEnvironmentMessage {
  userId: str;
  repoId: str;
  repoOwner: str;
  repoName: str;
  defaultBranch: str;
  installationId: num;
  appId: str;
  entrypoint: str;
  timestamp: num;
}

struct GetListOfEntrypointsProps{
  accessToken: str;
  owner: str;
  repo: str;
  defaultBranch: str;
}

struct EnvironmentReportMessage {
  environmentId: str;
}

// TODO: https://github.com/winglang/wing/issues/3644
class Util {
  extern "./util.js" pub static inflight replaceAll(value:str, regex:str, replacement:str): str;
  extern "./util.js" pub static inflight parseLog(log: str): Log?;

  pub static inflight parseLogs(messages: Array<str>): Array<Log> {
    let var parsedLogs = MutArray<Log>[];

    let var previousTime = "";
    for message in messages {
      if let var log = Util.parseLog(message) {
        if (log.timestamp != "") {
            previousTime = log.timestamp;
        } else {
            log = Log {
                message: log.message,
                timestamp: previousTime,
            };
        }
        parsedLogs.push(log);
      }
    }
    return parsedLogs.copy();
  }
}

bring "./environment-manager.w" as EnvironmentManager;
bring "./status-reports.w" as status_reports;
bring "./probot-adapter.w" as adapter;
bring "./octokit.w" as Octokit;

struct ApiProps {
  api: cloud.Api;
  ws: websockets.WebSocket;
  apps: Apps.Apps;
  users: Users.Users;
  environments: Environments.Environments;
  environmentManager: EnvironmentManager.EnvironmentManager;
  secrets: Secrets.Secrets;
  endpoints: Endpoints.Endpoints;
  probotAdapter: adapter.ProbotAdapter;
  githubAppClientId: str;
  githubAppClientSecret: str;
  appSecret: str;
  wsSecret: str;
  logs: cloud.Bucket;
  onEnvironmentChange: cloud.Topic;
  onEndpointChange: cloud.Topic;
}


struct EnvironmentAction {
  type: str;
  data: Json;
}

pub class Api {
  new(props: ApiProps) {
    let api = new json_api.JsonApi(api: props.api);
    let ws = props.ws;
    let apps = props.apps;
    let users = props.users;
    let logs = props.logs;
    let environmentsQueue = new cloud.Queue() as "Environments Queue";

    let invalidateQuery = new InvalidateQuery.InvalidateQuery(ws: ws);

    props.onEnvironmentChange.onMessage(inflight (event) => {
      let environment = Environments.Environment.fromJson(Json.parse(event));
      let app = apps.get(appId: environment.appId);
      invalidateQuery.invalidate(userId: app.userId, queries: [
        "app.listEnvironments"
      ]);
    });

    props.onEndpointChange.onMessage(inflight (event) => {
      let endpoint = Endpoints.Endpoint.fromJson(Json.parse(event));
      let app = apps.get(appId: endpoint.appId);
      invalidateQuery.invalidate(userId: app.userId, queries: [
        "app.environment.endpoints"
      ]);
    });

    let AUTH_COOKIE_NAME = "auth";

    let githubAccessTokens = new github_tokens_table.GithubAccessTokensTable(
      encryptionKey: props.appSecret,
    );

    let getJWTPayloadFromCookie = inflight (request: cloud.ApiRequest): JWT.JWTPayload? => {
      let headers = lowkeys.LowkeysMap.fromMap(request.headers ?? {});
      if let cookies = headers.tryGet("cookie") {
        if let jwt = Cookie.Cookie.parse(cookies).tryGet(AUTH_COOKIE_NAME) {
          try {
            return JWT.JWT.verify(
              jwt: jwt,
              secret: props.appSecret,
            );
          } catch {
            return nil;
          }
        }
      }
    };

    let getJWTPayloadFromBearer = inflight (publicKey: str, request: cloud.ApiRequest): Map<str>? => {
      let headers = lowkeys.LowkeysMap.fromMap(request.headers ?? {});
      let input = Json.parse(request.body ?? "");

      if let authHeader = headers.tryGet("authorization") {
        let token = authHeader.replace("Bearer","").trim();
        try {
          return KeyPair.KeyPair.verify(token: token, publicKey: publicKey);
        } catch {
          return nil;
        }
      }
    };

    let getUserIdFromCookie = inflight (request: cloud.ApiRequest) => {
      if let payload = getJWTPayloadFromCookie(request) {
        return payload.userId;
      }
      throw httpError.HttpError.unauthorized();
    };

    let getUserFromCookie = inflight (request: cloud.ApiRequest): UserFromCookie => {
      let userId = getUserIdFromCookie(request);
      let user = users.get(userId: userId);
      return {
        userId: userId,
        username: user.username,
      };
    };

    let checkOwnerAccessRights = inflight (request, owner: str) => {
      let user = getUserFromCookie(request);
      // TODO: Currently we only allow the signed in user to access their own resources.
      if user.username != owner {
        throw httpError.HttpError.notFound("User '{owner}' not found");
      }
    };

    let checkAppAccessRights = inflight (userId: str, app: Apps.App): Apps.App => {
      if userId != app.userId {
        throw httpError.HttpError.notFound("App not found");
      }
      return app;
    };

    let getAccessTokenFromCookie = inflight (request: cloud.ApiRequest) => {
      if let payload = getJWTPayloadFromCookie(request) {
        return githubAccessTokens.get(payload.userId)?.access_token;
      }
    };

    let getInstallationId = inflight(accessToken: str, repoOwner: str): num => {
      let installations = GitHub.Client.listUserInstallations(accessToken);
      for installation in installations.data {
        if installation.account.login == repoOwner {
          return installation.id;
        }
      }
      throw httpError.HttpError.badRequest("Installation not found");
    };

    api.get("/wrpc/ws.auth", inflight (request) => {
      try {
        let userId = getUserIdFromCookie(request);

        let jwt = JWT.JWT.sign(
          secret: props.wsSecret,
          userId: userId,
          expirationTime: "1m",
        );
        return {
          body: {
            token: jwt,
          },
        };
      } catch {
        log("User not authenticated. Rejecting websocket connection");
      }
    });

    api.get("/wrpc/auth.check", inflight (request) => {
      try {
        // check if the user from the cookie is valid
        let userId = getUserIdFromCookie(request);

        // check if user exists in the db
        let user = users.get(userId: userId);

        return {
          body: {
            user: user
          },
        };
      } catch {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.post("/wrpc/auth.signOut", inflight (request) => {
      return {
        headers: {
          "Set-Cookie": Cookie.Cookie.serialize(
            AUTH_COOKIE_NAME,
            "",
            {
              httpOnly: true,
              secure: true,
              sameSite: "strict",
              expires: 0,
              path: "/",
            },
          ),
        },
        body: {
        },
      };
    });

    api.get("/wrpc/github.callback", inflight (request) => {
      let code = request.query.get("code");

      let tokens = GitHub.Exchange.codeForTokens(
        code: code,
        clientId: props.githubAppClientId,
        clientSecret: props.githubAppClientSecret,
      );

      let githubUser = GitHub.Client.getUser(tokens.access_token);

      let user = users.updateOrCreate(
        displayName: githubUser.name,
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        email: githubUser.email,
      );

      githubAccessTokens.set(user.id, tokens);

      let jwt = JWT.JWT.sign(
        secret: props.appSecret,
        userId: user.id,
      );

      let authCookie = Cookie.Cookie.serialize(
        AUTH_COOKIE_NAME,
        jwt,
        {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          path: "/",
          maxAge: 1h.seconds,
        },
      );

      return {
        status: 302,
        headers: {
          Location: "/{user.username}",
          "Set-Cookie": authCookie,
        },
      };
    });

    api.get("/wrpc/github.listInstallations", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let page = num.fromStr(request.query.get("page"));
        let data = GitHub.Client.listUserInstallations(accessToken, page);

        return {
          body: data,
        };
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.get("/wrpc/github.listRepositories", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let installationId = num.fromStr(request.query.get("installationId"));
        let page = num.fromStr(request.query.get("page"));

        let data = GitHub.Client.listInstallationRepos(accessToken, installationId, page);

        return {
          body: data,
        };
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.get("/wrpc/github.getRepository", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let owner = request.query.get("owner");
        let repo = request.query.get("repo");

        let repository = GitHub.Client.getRepository({
          token: accessToken,
          owner: owner,
          repo: repo,
        });

        return {
          body: {
            repository: repository
          },
        };
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.get("/wrpc/github.getPullRequest", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let owner = request.query.get("owner");
        let repo = request.query.get("repo");
        let pullNumber = request.query.get("pullNumber");

        let pullRequest = GitHub.Client.getPullRequest({
          token: accessToken,
          owner: owner,
          repo: repo,
          pull_number: pullNumber,
        });

        return {
          body: {
            pullRequest: pullRequest
          },
        };
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    let productionEnvironmentQueue = new cloud.Queue() as "Production Environment Queue";
    productionEnvironmentQueue.setConsumer(inflight (event) => {
      let input = CreateProductionEnvironmentMessage.fromJson(Json.parse(event));
      if let accessToken = githubAccessTokens.get(input.userId)?.access_token {
        let commitData = GitHub.Client.getLastCommit(
          token: accessToken,
          owner:  input.repoOwner,
          repo: input.repoName,
          default_branch: input.defaultBranch,
        );

        let installationId = input.installationId;
        environmentsQueue.push(Json.stringify(EnvironmentAction {
          type: "create",
          data: EnvironmentManager.CreateEnvironmentOptions {
            createEnvironment: {
              branch: input.defaultBranch,
              sha: commitData.sha,
              appId: input.appId,
              type: "production",
              prTitle: input.defaultBranch,
              repo: input.repoId,
              status: "initializing",
              installationId: installationId,
            },
            appId: input.appId,
            entrypoint: input.entrypoint,
            sha: commitData.sha,
            owner: input.repoOwner,
            timestamp: input.timestamp,
        }}));
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    let getListOfEntrypoints = inflight (props: GetListOfEntrypointsProps): MutArray<str> => {
      let octokit = Octokit.octokit(props.accessToken);
      let ref = octokit.git.getRef(owner: props.owner, repo: props.repo, ref: "heads/{props.defaultBranch}");
      let tree = octokit.git.getTree(owner: props.owner, repo: props.repo, tree_sha: ref.data.object.sha, recursive: "true");

      let entrypoints = MutArray<str>[];
      for item in tree.data.tree {
        if let path = item.path {
          if item.type == "blob" {
            if path.endsWith("main.w") || path.endsWith("main.ts") {
              entrypoints.push(path);
            }
          }
        }
      }
      return entrypoints;
    };

    let getMainEntrypointFile = inflight (props: GetListOfEntrypointsProps): str => {
      let entrypoints = getListOfEntrypoints(props);

      for entrypoint in entrypoints {
        if fs.basename(entrypoint) == "main.w" {
          return entrypoint;
        }
      }
      // don't know if we should throw an exception here or let the failure happen in the preview deployment phase
      return "";
    };

    api.post("/wrpc/app.create", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let user = getUserFromCookie(request);

        let input = Json.parse(request.body ?? "");
        let owner = users.fromLoginOrFail(username: input.get("owner").asStr());

        if user.username != owner.username {
          throw httpError.HttpError.unauthorized();
        }

        let defaultBranch = input.get("defaultBranch").asStr();
        let repoOwner = input.get("repoOwner").asStr();
        let repoName = input.get("repoName").asStr();
        let installationId = getInstallationId(accessToken, repoOwner);
        let repoId = "{repoOwner}/{repoName}";

        // get application default entrypoint path (main.w)
        let entrypoint = getMainEntrypointFile(GetListOfEntrypointsProps{
          accessToken: accessToken,
          owner: repoOwner,
          repo: repoName,
          defaultBranch: defaultBranch,
         });

        // TODO: https://github.com/winglang/wing/issues/3644
        let appName = Util.replaceAll(input.get("appName").asStr(), "[^a-zA-Z0-9-]+", "*");
        if appName.contains("*") {
          return {
            status: 422,
            body: {
              message: "Invalid app name. Must consist of alphanumeric characters and hiphens only.",
            },
          };
        }

        let appId = apps.create(
          appName: appName,
          description: input.tryGet("description")?.tryAsStr() ?? "",
          repoId: repoId,
          repoName: repoName,
          repoOwner: repoOwner,
          userId: owner.id,
          entrypoint: entrypoint,
          createdAt: datetime.utcNow().toIso(),
        );

        productionEnvironmentQueue.push(Json.stringify(CreateProductionEnvironmentMessage {
          userId: user.userId,
          repoId: repoId,
          repoOwner: repoOwner,
          repoName: repoName,
          defaultBranch: defaultBranch,
          installationId: installationId,
          appId: appId,
          entrypoint: entrypoint,
          timestamp: datetime.utcNow().timestampMs,
        }));

        invalidateQuery.invalidate(userId: user.userId, queries: ["app.list"]);

        return {
          body: {
            appId: appId,
            appName: appName,
            appFullName: "{user.username}/{appName}",
          },
        };
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.get("/wrpc/app.list", inflight (request) => {
      let owner = request.query.get("owner");
      checkOwnerAccessRights(request, owner);

      if let user = props.users.fromLogin(username: owner) {
        let userApps = apps.list(
          userId: user.id,
        );
        return {
          body: {
            apps: userApps,
          },
        };
      }

      throw httpError.HttpError.notFound();
    });

    let deleteAppQueue = new cloud.Queue() as "Delete App Queue";
    deleteAppQueue.setConsumer(inflight (event) => {
      let input = DeleteAppMessage.fromJson(Json.parse(event));

      let environments = props.environments.list(
        appId: input.appId,
      );

      for environment in environments {
        props.environmentManager.stop(
          appId: input.appId,
          appName: input.appName,
          environment: environment,
          timestamp: input.timestamp,
          delete: true,
        );
      }
    });

    api.post("/wrpc/app.delete", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let input = Json.parse(request.body ?? "");

      let owner = input.get("owner").asStr();
      let appName = input.get("appName").asStr();

      checkOwnerAccessRights(request, owner);

      let app = apps.getByName(
        userId: userId,
        appName: appName,
      );

      apps.delete(
        appId: app.appId,
        userId: userId,
      );

      deleteAppQueue.push(Json.stringify(DeleteAppMessage {
        appId: app.appId,
        appName: app.appName,
        userId: app.userId,
        timestamp: datetime.utcNow().timestampMs,
      }));

      invalidateQuery.invalidate(userId: userId, queries: ["app.list"]);

      return {
        body: {
          appId: app.appId,
        },
      };
    });

    api.get("/wrpc/app.getByName", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      checkOwnerAccessRights(request, request.query.get("owner"));

      let appName = request.query.get("appName");

      let app = apps.getByName(
        userId: userId,
        appName: appName,
      );

      return {
        body: {
          app: app,
        },
      };
    });

    api.get("/wrpc/app.listEnvironments", inflight (request) => {
      let userId = getUserIdFromCookie(request);

      if let owner = props.users.fromLogin(username: request.query.get("owner")) {
        let appName = request.query.get("appName");
        let app = props.apps.getByName(appName: appName, userId: owner.id);
        checkAppAccessRights(userId, app);

        let environments = props.environments.list(
          appId: app.appId,
        );

        return {
          body: {
            environments: environments,
          },
        };
      }

      throw httpError.HttpError.notFound();
    });

    api.get("/wrpc/app.environment", inflight (request) => {
      let userId = getUserIdFromCookie(request);

      if let owner = props.users.fromLogin(username: request.query.get("owner")) {
        let appName = request.query.get("appName");
        let branch = request.query.get("branch");

        let app = apps.getByName(
          userId: owner.id,
          appName: appName,
        );
        checkAppAccessRights(userId, app);

        let environment = props.environments.getByBranch(
          appId: app.appId,
          branch: branch,
        );

        return {
          body: {
            environment: environment,
          },
        };
      }

      throw httpError.HttpError.notFound();
    });

    api.get("/wrpc/app.listSecrets", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let appId = request.query.get("appId");

      let app = apps.get(
        appId: appId,
      );
      checkAppAccessRights(userId, app);

      let prodSecrets = props.secrets.list(appId: appId, environmentType: "production");
      let previewSecrets = props.secrets.list(appId: appId, environmentType: "preview");

      return {
        body: {
          secrets: prodSecrets.concat(previewSecrets)
        },
      };
    });

    api.post("/wrpc/app.decryptSecret", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let input = Json.parse(request.body ?? "");

      let appId = input.get("appId").asStr();
      let app = apps.get(
        appId: appId,
      );
      checkAppAccessRights(userId, app);

      let secretId = input.get("secretId").asStr();
      let environmentType = input.get("environmentType").asStr();

      let secret = props.secrets.get(id: secretId, appId: appId, environmentType: environmentType, decryptValue: true);

      return {
        body: {
          value: secret.value,
        },
      };
    });

    api.post("/wrpc/app.createSecret", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();

      let app = apps.get(
        appId: appId,
      );
      checkAppAccessRights(userId, app);

      let environmentType = input.get("environmentType").asStr();
      if environmentType != "production" && environmentType != "preview" {
        throw httpError.HttpError.badRequest(
          "Invalid environment type",
        );
      }

      let name = input.get("name").asStr();
      if name == "" {
        throw httpError.HttpError.badRequest(
          "Invalid name",
        );
      }

      let value = input.get("value").asStr();
      if value == "" {
        throw httpError.HttpError.badRequest(
          "Invalid value",
        );
      }

      let secret = props.secrets.create(appId: appId, environmentType: environmentType, name: name, value: value);

      invalidateQuery.invalidate(userId: app.userId, queries: [
        "app.listSecrets",
      ]);

      return {
        body: {
          secretId: secret.id
        }
      };
    });

    api.post("/wrpc/app.deleteSecret", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();

      let app = apps.get(
        appId: appId,
      );
      checkAppAccessRights(userId, app);

      let environmentType = input.get("environmentType").asStr();
      let secretId = input.get("secretId").asStr();

      props.secrets.delete(id: secretId, appId: appId, environmentType: environmentType);

      invalidateQuery.invalidate(userId: app.userId, queries: [
        "app.listSecrets",
      ]);

      return {
        body: {
          secretId: secretId
        }
      };
    });

    api.get("/wrpc/app.listEntrypoints", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let owner = request.query.get("owner");
        let repo = request.query.get("repo");
        let defaultBranch = request.query.get("default_branch");

        let entrypoints = getListOfEntrypoints(GetListOfEntrypointsProps{
          accessToken: accessToken,
          owner: owner,
          repo: repo,
          defaultBranch: defaultBranch,
        });

        return {
          body: {
            entrypoints: entrypoints.copy()
          },
        };
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.post("/wrpc/app.updateEntrypoint", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();

      let app = apps.get(appId: appId);
      checkAppAccessRights(userId, app);

      let entrypoint = input.get("entrypoint").asStr();
      apps.updateEntrypoint(
        appId: appId,
        appName: app.appName,
        repository: app.repoId,
        userId: userId,
        entrypoint: entrypoint,
      );

      environmentsQueue.push(Json.stringify(EnvironmentAction{
        type: "restartAll",
        data: EnvironmentManager.RestartAllEnvironmentOptions {
          appId: appId,
          entrypoint: entrypoint,
          timestamp: datetime.utcNow().timestampMs,
      }}));

      invalidateQuery.invalidate(userId: userId, queries: [
        "app.listEntrypoints",
      ]);

      return {
        body: {
          appId: appId,
        },
      };
    });

    api.get("/wrpc/app.environment.logs", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      checkOwnerAccessRights(request, request.query.get("owner"));

      let appName = request.query.get("appName");
      let branch = request.query.get("branch");

      let app = apps.getByName(
        userId: userId,
        appName: appName,
      );
      checkAppAccessRights(userId, app);

      let environment = props.environments.getByBranch(
        appId: app.appId,
        branch: branch,
      );

      let envId = environment.id;

      let deployMessages = logs.tryGet("{envId}/deployment.log")?.split("\n") ?? [];
      let deployLogs = Util.parseLogs(deployMessages);

      let runtimeMessages = logs.tryGet("{envId}/runtime.log")?.split("\n") ?? [];
      let runtimeLogs = Util.parseLogs(runtimeMessages);

      let testEntries = logs.list("{envId}/tests");
      let testLogs = MutArray<TestLog>[];

      for entry in testEntries {
        let testResults = logs.getJson(entry);
        testLogs.push(TestLog.fromJson(testResults));
      }

      return {
        body: {
          deploy: deployLogs,
          runtime: runtimeLogs,
          tests: testLogs.copy()
        },
      };
    });

    api.get("/wrpc/app.environment.endpoints", inflight (request) => {
      let user = getUserFromCookie(request);

      let appName = request.query.get("appName");
      let branch = request.query.get("branch");

      let appId = apps.getByName(
        userId: user.userId,
        appName: appName,
      ).appId;

      let environment = props.environments.getByBranch(
        appId: appId,
        branch: branch,
      );

      let endpoints = props.endpoints.list(environmentId: environment.id);

      return {
        body: {
          endpoints: endpoints,
        },
      };
    });


    let notifyEnvReportQueue = new cloud.Queue() as "Environment Report Queue";
    notifyEnvReportQueue.setConsumer(inflight (event) => {
      let input = EnvironmentReportMessage.fromJson(Json.parse(event));

      let environment = props.environments.get(id: input.environmentId);
      let app = props.apps.get(appId: environment.appId);

      invalidateQuery.invalidate(userId: app.userId, queries: [
        "app.listEnvironments",
        "app.environment",
        "app.environment.logs",
        "app.environment.endpoints",
      ]);
    });

    api.post("/environment.report", inflight (request) => {
      if let event = request.body {
        log("report status: {event}");
        let data = Json.parse(event);
        let statusReport = status_reports.StatusReport.fromJson(data);
        let publicKey = props.environments.getPublicKey(id: statusReport.environmentId);

        if let payload = getJWTPayloadFromBearer(publicKey, request) {
          let payloadEnvironmentId = payload.get("environmentId");

          if payloadEnvironmentId == statusReport.environmentId {
            props.environmentManager.updateStatus(statusReport: statusReport);

            notifyEnvReportQueue.push(Json.stringify(EnvironmentReportMessage {
              environmentId: statusReport.environmentId,
            }));

            return {
              status: 200
            };
          }
        }
      }
      throw httpError.HttpError.badRequest("Invalid status report");
    });

    environmentsQueue.setConsumer(inflight (event) => {
      try {
        let action = EnvironmentAction.parseJson(event);
        if action.type == "create" {
          log("create new environment event: {event}");
          let createOptions = EnvironmentManager.CreateEnvironmentOptions.fromJson(action.data);
          props.environmentManager.create(createOptions);
        } elif action.type == "restartAll" {
          log("restart all environments event: {event}");
          let restartAllOptions = EnvironmentManager.RestartAllEnvironmentOptions.fromJson(action.data);
          props.environmentManager.restartAll(restartAllOptions);
        }
      } catch err {
        log("failed to execute environment action {err}");
      }
    });
  }
}
