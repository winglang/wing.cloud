bring cloud;
bring http;
bring ex;
bring util;

bring "./json-api.w" as json_api;
bring "./cookie.w" as Cookie;
bring "./github.w" as GitHub;
bring "./jwt.w" as JWT;
bring "./apps.w" as Apps;
bring "./users.w" as Users;
bring "./environments.w" as Environments;
bring "./secrets.w" as Secrets;
bring "./lowkeys-map.w" as lowkeys;

// TODO: https://github.com/winglang/wing/issues/3644
class Util {
  extern "./util.js" pub static inflight replaceAll(value:str, regex:str, replacement:str): str;
}
bring "./environment-manager.w" as EnvironmentManager;
bring "./status-reports.w" as status_reports;
bring "./probot-adapter.w" as adapter;
bring "./octokit.w" as Octokit;

struct ApiProps {
  api: cloud.Api;
  apps: Apps.Apps;
  users: Users.Users;
  environments: Environments.Environments;
  environmentManager: EnvironmentManager.EnvironmentManager;
  secrets: Secrets.Secrets;
  probotAdapter: adapter.ProbotAdapter;
  githubAppClientId: str;
  githubAppClientSecret: str;
  appSecret: str;
  logs: cloud.Bucket;
}

struct Log {
  message: str;
  timestamp: num;
}

struct EnvironmentAction {
  type: str;
  data: Json;
}

pub class Api {
  new(props: ApiProps) {
    let api = new json_api.JsonApi(api: props.api);
    let apps = props.apps;
    let users = props.users;
    let logs = props.logs;
    let queue = new cloud.Queue();

    let AUTH_COOKIE_NAME = "auth";

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

    let getUserFromCookie = inflight (request: cloud.ApiRequest) => {
      if let payload = getJWTPayloadFromCookie(request) {
        return payload.userId;
      } else {
        throw "Unauthorized";
      }
    };

    let getAccessTokenFromCookie = inflight (request: cloud.ApiRequest) => {
      let payload = getJWTPayloadFromCookie(request);
      return payload?.accessToken;
    };

    api.get("/wrpc/auth.check", inflight (request) => {
      if let payload = getJWTPayloadFromCookie(request) {
        // check if the user from the cookie is valid
        let userId = getUserFromCookie(request);

        // check if user exists in the db
        let username = users.getUsername(userId: userId);

        return {
          body: {
            userId: payload.userId,
            username: username,
          },
        };
      }
      throw "Unauthorized";
    });

    api.post("/wrpc/auth.signout", inflight (request) => {
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
      log("tokens = ${Json.stringify(tokens)}");

      let gitHubLogin = GitHub.Exchange.getLoginFromAccessToken(tokens.access_token);
      log("gitHubLogin = ${gitHubLogin}");
      let userId = users.getOrCreate(gitHubLogin: gitHubLogin);
      log("userId = ${userId}");

      let jwt = JWT.JWT.sign(
        secret: props.appSecret,
        userId: userId,
        accessToken: tokens.access_token,
        accessTokenExpiresIn: tokens.expires_in,
        refreshToken: tokens.refresh_token,
        refreshTokenExpiresIn: tokens.refresh_token_expires_in,
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
          Location: "/apps/",
          "Set-Cookie": authCookie,
        },
      };
    });

    api.get("/wrpc/github.listInstallations", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        log("accessToken = ${accessToken}");

        let installations = GitHub.Client.listUserInstallations(accessToken);

        log("installations = ${Json.stringify(installations)}");

        return {
          body: {
            installations: installations,
          },
        };
      } else {
        return {
          status: 401,
        };
      }
    });

    api.get("/wrpc/github.listRepositories", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        log("accessToken = ${accessToken}");

        let installationId = num.fromStr(request.query.get("installationId"));

        let repositories = GitHub.Client.listInstallationRepos(accessToken, installationId);

        log("repositories = ${Json.stringify(repositories)}");

        return {
          body: {
            repositories: repositories
          },
        };
      } else {
        return {
          status: 401,
        };
      }
    });

    api.get("/wrpc/github.getRepository", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        log("accessToken = ${accessToken}");

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
        return {
          status: 401,
        };
      }
    });

    api.get("/wrpc/github.getPullRequest", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        log("accessToken = ${accessToken}");

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
        return {
          status: 401,
        };
      }
    });

    api.get("/wrpc/app.get", inflight (request) => {
      let userId = getUserFromCookie(request);

      let appId = request.query.get("appId");

      let app = apps.get(
        appId: appId,
      );

      if app.userId != userId {
        return {
          status: 403,
          body: {
            error: "Forbidden",
          },
        };
      }

      return {
        body: {
            app: app,
        },
      };
    });

    api.get("/wrpc/app.getByName", inflight (request) => {
      let userId = getUserFromCookie(request);

      let appName = request.query.get("appName");

      let app = apps.getByName(
        userId: userId,
        appName: appName,
      );

      if app.userId != userId {
        return {
          status: 403,
          body: {
            error: "Forbidden",
          },
        };
      }

      return {
        body: {
            app: app,
        },
      };
    });

    api.post("/wrpc/app.delete", inflight (request) => {
      let userId = getUserFromCookie(request);

      let input = Json.parse(request.body ?? "");
      let appName = input.get("appName").asStr();

      let appId = apps.getByName(
        userId: userId,
        appName: appName,
      ).appId;

      apps.delete(
        appId: appId,
        userId: userId,
      );

      return {
        body: {
          appId: appId,
        },
      };
    });

    api.get("/wrpc/app.environments", inflight (request) => {
      let userId = getUserFromCookie(request);

      let appId = props.apps.getByName(
        userId: userId,
        appName: request.query.get("appName"),
      ).appId;

      let environments = props.environments.list(
        appId: appId,
      );

      return {
        body: {
          environments: environments,
        },
      };
    });

    api.get("/wrpc/app.environment", inflight (request) => {
      let userId = getUserFromCookie(request);

      let appName = request.query.get("appName");
      let branch = request.query.get("branch");

      let appId = apps.getByName(
        userId: userId,
        appName: appName,
      ).appId;

      let environment = props.environments.getByBranch(
        appId: appId,
        branch: branch,
      );

      return {
        body: {
          environment: environment,
        },
      };
    });

    api.get("/wrpc/app.listSecrets", inflight (request) => {
      let userId = getUserFromCookie(request);
      let appId = request.query.get("appId");
      let prodSecrets = props.secrets.list(appId: appId, environmentType: "production");
      let previewSecrets = props.secrets.list(appId: appId, environmentType: "preview");

      return {
        body: {
          secrets: prodSecrets.concat(previewSecrets)
        },
      };

    });

    api.post("/wrpc/app.decryptSecret", inflight (request) => {
      let userId = getUserFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();
      let secretId = input.get("secretId").asStr();
      let environmentType = input.get("environmentType").asStr();

      let secret = props.secrets.get(id: secretId, appId: appId, environmentType: environmentType, decryptValue: true);

      return {
        status: 200,
        body: {
          value: secret.value,
        },
      };
    });

    api.post("/wrpc/app.createSecret", inflight (request) => {
      let userId = getUserFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();
      let environmentType = input.get("environmentType").asStr();
      if environmentType != "production" && environmentType != "preview" {
        return {
          status: 400,
          body: { error: "invalid environment type" }
        };
      }

      let name = input.get("name").asStr();
      if name == "" {
        return {
          status: 400,
          body: { error: "invalid name" }
        };
      }

      let value = input.get("value").asStr();
      if value == "" {
        return {
          status: 400,
          body: { error: "invalid value" }
        };
      }

      let secret = props.secrets.create(appId: appId, environmentType: environmentType, name: name, value: value);

      return {
        status: 200,
        body: {
          secretId: secret.id
        }
      };
    });

    api.post("/wrpc/app.deleteSecret", inflight (request) => {
      let userId = getUserFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();
      let environmentType = input.get("environmentType").asStr();
      let secretId = input.get("secretId").asStr();

      props.secrets.delete(id: secretId, appId: appId, environmentType: environmentType);

      return {
        status: 200,
        body: {
          secretId: secretId
        }
      };
    });

    api.get("/wrpc/app.listEntryfiles", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        log("accessToken = ${accessToken}");

        let owner = request.query.get("owner");
        let repo = request.query.get("repo");
        let defaultBranch = request.query.get("default_branch");

        let octokit = Octokit.octokit(accessToken);
        let ref = octokit.git.getRef(owner: owner, repo: repo, ref: "heads/${defaultBranch}");
        let tree = octokit.git.getTree(owner: owner, repo: repo, tree_sha: ref.data.object.sha, recursive: "true");

        let entryfiles = MutArray<str>[];
        for item in tree.data.tree {
          if let path = item.path {
            if item.type == "blob" && path.endsWith("main.w") {
              entryfiles.push(path);
            }
          }
        }

        return {
          body: {
            entryfiles: entryfiles.copy()
          },
        };
      } else {
        return {
          status: 401,
        };
      }
    });

    api.post("/wrpc/app.updateEntryfile", inflight (request) => {
      log("${Json.stringify(request)}");
      let userId = getUserFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();
      let appName = input.get("appName").asStr();
      let repoId = input.get("repoId").asStr();
      let entryfile = input.get("entryfile").asStr();
      apps.updateEntrypoint(appId: appId, appName: appName, repository: repoId, userId: userId, entryfile: entryfile);

      let app = apps.get(appId: appId);
      queue.push(Json.stringify(EnvironmentAction{
        type: "restartAll",
        data: EnvironmentManager.RestartAllEnvironmentOptions {
          appId: appId,
          entryfile: app.entryfile,
      }}));

      return {
        status: 200,
        body: {
          appId: appId,
        },
      };
    });

    api.get("/wrpc/app.environment.logs", inflight (request) => {
      let userId = getUserFromCookie(request);

      let appName = request.query.get("appName");
      let branch = request.query.get("branch");

      let appId = apps.getByName(
        userId: userId,
        appName: appName,
      ).appId;

      let environment = props.environments.getByBranch(
        appId: appId,
        branch: branch,
      );

      let envId = environment.id;

      let buildMessages = logs.tryGet("${envId}/deployment.log")?.split("\n") ?? [];
      let buildLogs = MutArray<Log>[];
      for message in buildMessages {
          buildLogs.push(Log {
            message: message,
            // TODO: logs should have timestamps
            timestamp: 0,
          });
      }

      let testEntries = logs.list("${envId}/tests");
      let testLogs = MutArray<Log>[];
      for entry in testEntries {
        let log = logs.get(entry);
        let messages = log.split("\n");
        for message in messages {
            testLogs.push(Log {
              message: message,
              // TODO: logs should have timestamps
              timestamp: 0,
            });
          }
      }

      return {
        body: {
          build: buildLogs.copy(),
          tests: testLogs.copy(),
        },
      };
    });

    let productionEnvironmentQueue = new cloud.Queue() as "Production Environment Queue";
    productionEnvironmentQueue.setConsumer(inflight (event) => {
      let input = Json.parse(event);

      let appId = input.get("appId").asStr();
      let entryfile = input.get("entryfile").asStr();
      let repoId = input.get("repoId").asStr();
      let defaultBranch = input.get("default_branch").asStr();

      let commitData = GitHub.Client.getLastCommit(
        token: input.get("accessToken").asStr(),
        owner:  input.get("repoOwner").asStr(),
        repo: input.get("repoName").asStr(),
        default_branch: defaultBranch,
      );

      let installationId = input.get("installationId").asNum();
      queue.push(Json.stringify(EnvironmentAction {
        type: "create",
        data: EnvironmentManager.CreateEnvironmentOptions {
          createEnvironment: {
            branch: defaultBranch,
            appId: appId,
            type: "production",
            prTitle: defaultBranch,
            repo: repoId,
            status: "initializing",
            installationId: installationId,
          },
          appId: appId,
          entryfile: entryfile,
          sha: commitData.sha,
      }}));
    });
    api.post("/wrpc/user.createApp", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let userId = getUserFromCookie(request);

        let input = Json.parse(request.body ?? "");

        let defaultBranch = input.get("default_branch").asStr();
        let repoId = input.get("repoId").asStr();
        let repoOwner = input.get("repoOwner").asStr();
        let repoName = input.get("repoName").asStr();
        let entryfile = input.get("entryfile").asStr();

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
          imageUrl: input.get("imageUrl").asStr(),
          userId: userId,
          entryfile: entryfile,
          createdAt: datetime.utcNow().toIso(),
        );

        productionEnvironmentQueue.push(Json.stringify({
          accessToken: accessToken,
          repoId: repoId,
          repoOwner: repoOwner,
          repoName: repoName,
          default_branch: defaultBranch,
          installationId: num.fromStr(input.get("installationId").asStr()),
          appId: appId,
          entryfile: entryfile,
        }));

        return {
          body: {
            appId: appId,
          },
        };
      } else {
        return {
          status: 401,
        };
      }
    });

    api.get("/wrpc/user.listApps", inflight (request) => {
      let userId = getUserFromCookie(request);

      let userApps = apps.list(
        userId: userId,
      );

      return {
        body: {
          apps: userApps,
        },
      };
    });

    api.post("/environment.report", inflight (req) => {
      if let event = req.body {
        log("report status: ${event}");
        let data = Json.parse(event);
        let statusReport = status_reports.StatusReport.fromJson(data);
        props.environmentManager.updateStatus(statusReport: statusReport);
      }

      return {
        status: 200
      };
    });

    // queue for environment actions
    queue.setConsumer(inflight (event) => {
      try {
        let action = EnvironmentAction.parseJson(event);
        if action.type == "create" {
          log("create new environment event: ${event}");
          let createOptions = EnvironmentManager.CreateEnvironmentOptions.fromJson(action.data);
          props.environmentManager.create(createOptions);
        } elif action.type == "restartAll" {
          log("restart all environments event: ${event}");
          let restartAllOptions = EnvironmentManager.RestartAllEnvironmentOptions.fromJson(action.data);
          props.environmentManager.restartAll(restartAllOptions);
        }
      } catch err {
        log("failed to execute environment action ${err}");
      }
    });
  }
}
