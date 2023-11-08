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

struct ApiProps {
  api: cloud.Api;
  apps: Apps.Apps;
  users: Users.Users;
  environments: Environments.Environments;
  githubAppClientId: str;
  githubAppClientSecret: str;
  appSecret: str;
}

pub class Api {
  init(props: ApiProps) {
    let api = new json_api.JsonApi(api: props.api);
    let apps = props.apps;
    let users = props.users;

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
        let userId = getUserFromCookie(request);
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
          Location: "/apps",
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

      let app = apps.get(
        id: request.query.get("id"),
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
        id: input.get("id").asStr(),
        name: input.get("name").asStr(),
        userId: userId,
        repository: input.get("repository").asStr(),
      );

      return {
      };
    });

    api.post("/wrpc/app.delete", inflight (request) => {
      let userId = getUserFromCookie(request);

      let input = Json.parse(request.body ?? "");

      apps.delete(
        id: input.get("id").asStr(),
        userId: userId,
        repository: input.get("repository").asStr(),
      );
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

    api.post("/wrpc/user.createApp", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let userId = getUserFromCookie(request);

        let input = Json.parse(request.body ?? "");

        let gitHubLogin = users.getUsername(userId: userId);

        let commitData = GitHub.Client.getLastCommit(
          token: accessToken,
          owner:  input.get("repoOwner").asStr(),
          repo: input.get("repoName").asStr(),
          default_branch: input.get("default_branch").asStr(),
        );

        // TODO: https://github.com/winglang/wing/issues/3644
        let appName = Util.replaceAll(input.get("appName").asStr(), "[^a-zA-Z0-9]+", "-");

        let appId = apps.create(
          name: appName,
          description: input.get("description").asStr(),
          repoId: input.get("repoId").asStr(),
          repoName: input.get("repoName").asStr(),
          repoOwner: input.get("repoOwner").asStr(),
          imageUrl: input.get("imageUrl").asStr(),
          entryfile: input.get("entryfile").asStr(),
          createdAt: datetime.utcNow().toIso(),
          createdBy: gitHubLogin,
          userId: userId,
          lastCommitMessage: commitData?.commit?.message ?? "",
        );

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
  }
}
