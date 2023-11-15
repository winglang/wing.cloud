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
bring "./lowkeys-map.w" as lowkeys;

// TODO: https://github.com/winglang/wing/issues/3644
class Util {
  extern "./util.js" pub static inflight replaceAll(value:str, regex:str, replacement:str): str;
}
bring "./environment-manager.w" as EnvironmentManager;
bring "./status-reports.w" as status_reports;
bring "./probot-adapter.w" as adapter;

struct ApiProps {
  api: cloud.Api;
  apps: Apps.Apps;
  users: Users.Users;
  environments: Environments.Environments;
  environmentManager: EnvironmentManager.EnvironmentManager;
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


    api.post("/wrpc/app.rename", inflight (request) => {
      let userId = getUserFromCookie(request);

      let input = Json.parse(request.body ?? "");

      apps.rename(
        appId: input.get("appId").asStr(),
        appName: input.get("appName").asStr(),
        userId: userId,
        repository: input.get("repository").asStr(),
      );

      return {
      };
    });

    api.post("/wrpc/app.delete", inflight (request) => {
      let userId = getUserFromCookie(request);

      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();

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

      let environments = props.environments.list(
        appId: request.query.get("appId"),
      );

      return {
        body: {
          environments: environments,
        },
      };
    });

    api.get("/wrpc/app.environment", inflight (request) => {
      let userId = getUserFromCookie(request);

      let environment = props.environments.get(
        id: request.query.get("environmentId"),
      );

      return {
        body: {
          environment: environment,
        },
      };
    });

    api.get("/wrpc/app.environment.logs", inflight (request) => {
      let userId = getUserFromCookie(request);

      let envId = request.query.get("environmentId");

      let buildMessages = logs.get("${envId}/deployment.log").split("\n");
      let buildLogs = MutArray<Log>[];
      for message in buildMessages {
          buildLogs.push(Log {
            message: message,
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

    api.post("/wrpc/user.createApp", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let userId = getUserFromCookie(request);

        let input = Json.parse(request.body ?? "");

        let gitHubLogin = users.getUsername(userId: userId);

        let defaultBranch = input.get("default_branch").asStr();
        let repoId = input.get("repoId").asStr();

        let commitData = GitHub.Client.getLastCommit(
          token: accessToken,
          owner:  input.get("repoOwner").asStr(),
          repo: input.get("repoName").asStr(),
          default_branch: input.get("default_branch").asStr(),
        );

        // TODO: https://github.com/winglang/wing/issues/3644
        let appName = Util.replaceAll(input.get("appName").asStr(), "[^a-zA-Z0-9]+", "-");

        let app = apps.create(
          appName: appName,
          description: input.tryGet("description")?.tryAsStr() ?? "",
          repoId: input.get("repoId").asStr(),
          repoName: input.get("repoName").asStr(),
          repoOwner: input.get("repoOwner").asStr(),
          imageUrl: input.get("imageUrl").asStr(),
          userId: userId,
          entryfile: input.get("entryfile").asStr(),
          createdAt: datetime.utcNow().toIso(),
          createdBy: gitHubLogin,
          lastCommitMessage: commitData?.commit?.message ?? "",
        );

        let installationId = num.fromStr(input.get("installationId").asStr());
        queue.push(Json.stringify(EnvironmentManager.CreateEnvironmentOptions {
          createEnvironment: {
            branch: defaultBranch,
            appId: app.appId,
            type: "production",
            prTitle: defaultBranch,
            repo: repoId,
            status: "initializing",
            installationId: installationId,
          },
          app: app,
          sha: commitData.sha,
        }));

        return {
          body: {
            appId: app.appId,
            appName: app.appName,
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

    // queue for new apps environment
    queue.setConsumer(inflight (event) => {
      try {
        log("create new environment event: ${event}");
        let createOptions = EnvironmentManager.CreateEnvironmentOptions.fromJson(Json.parse(event));
        props.environmentManager.create(createOptions);
      } catch err {
        log("failed to create new environment ${err}");
      }
    });
  }
}
