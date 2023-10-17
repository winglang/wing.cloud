bring cloud;
bring http;
bring ex;
bring util;

bring "./cookie.w" as Cookie;
bring "./github.w" as GitHub;
bring "./jwt.w" as JWT;
bring "./projects.w" as Projects;
bring "./users.w" as Users;

struct ApiProps {
  api: cloud.Api;
  projects: Projects.Projects;
  users: Users.Users;
  githubAppClientId: inflight (): str;
  githubAppClientSecret: inflight (): str;
  appSecret: inflight (): str;
}

class Api {
  init(props: ApiProps) {
    let api = props.api;
    let projects = props.projects;
    let users = props.users;
    let GITHUB_APP_CLIENT_ID = props.githubAppClientId;
    let GITHUB_APP_CLIENT_SECRET = props.githubAppClientSecret;
    let APP_SECRET = props.appSecret;

    let captureUnhandledErrors = inflight (handler: inflight (): cloud.ApiResponse): cloud.ApiResponse => {
      try {
        return handler();
      } catch error {
        return {
          status: 500,
          body: Json.stringify({
            error: error,
          }),
        };
      }
    };

    let AUTH_COOKIE_NAME = "auth";

    let getJWTPayloadFromCookie = inflight (request: cloud.ApiRequest): JWT.JWTPayload? => {
      if let cookies = request.headers?.get("cookie") {
        let jwt = Cookie.Cookie.parse(cookies).get(AUTH_COOKIE_NAME);
        log("jwt = ${jwt}");

        return JWT.JWT.verify(
          jwt: jwt,
          secret: APP_SECRET(),
        );
      }
    };

    let getUserFromCookie = inflight (request: cloud.ApiRequest) => {
      let payload = getJWTPayloadFromCookie(request);
      return payload?.userId;
    };

    let getAccessTokenFromCookie = inflight (request: cloud.ApiRequest) => {
      let payload = getJWTPayloadFromCookie(request);
      return payload?.accessToken;
    };

    // https://github.com/login/oauth/authorize?client_id=Iv1.29ba054d6e919d9c
    api.get("/wrpc/github.callback", inflight (request) => {
      return captureUnhandledErrors(inflight () => {
        let code = request.query.get("code");

        let tokens = GitHub.Exchange.codeForTokens(
          code: code,
          clientId: GITHUB_APP_CLIENT_ID(),
          clientSecret: GITHUB_APP_CLIENT_SECRET(),
        );
        log("tokens = ${Json.stringify(tokens)}");

        let gitHubLogin = GitHub.Exchange.getLoginFromAccessToken(tokens.access_token);
        log("gitHubLogin = ${gitHubLogin}");
        let userId = users.getOrCreate(gitHubLogin: gitHubLogin);
        log("userId = ${userId}");

        let jwt = JWT.JWT.sign(
          secret: APP_SECRET(),
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
            Location: "/dashboard/projects",
            "Set-Cookie": authCookie,
          },
        };
      });
    });

    api.get("/wrpc/github.listInstallations", inflight (request) => {
      return captureUnhandledErrors(inflight () => {
        let accessToken = getAccessTokenFromCookie(request);
        log("accessToken = ${accessToken}");

        if (!accessToken?) {
          return {
            status: 401,
          };
        }

        let installations = GitHub.Exchange.listUserInstallations(accessToken ?? "");

        log("installations = ${Json.stringify(installations)}");

        return {
          status: 200,
          body: Json.stringify({
            installations: installations,
          }),
        };
      });
    });

    api.get("/wrpc/github.listRepositories", inflight (request) => {
      return captureUnhandledErrors(inflight () => {
        let accessToken = getAccessTokenFromCookie(request);
        log("accessToken = ${accessToken}");

        if (!accessToken?) {
          return {
            status: 401,
          };
        }

        let installationId = num.fromStr(request.query.get("installationId"));

        let repositories = GitHub.Exchange.listInstallationRepos(accessToken ?? "", installationId);

        log("repositories = ${Json.stringify(repositories)}");

        return {
          status: 200,
          body: Json.stringify({
            repositories: repositories
          }),
        };
      });
    });

    api.get("/wrpc/project.get", inflight (request) => {
      return captureUnhandledErrors(inflight () => {
        let userId2 = getUserFromCookie(request);
        log("userId2 = ${userId2}");
        let input = Projects.GetProjectOptions.fromJson(request.query);

        // TODO: Authorize.
        let project = projects.get(input);

        let userId = getUserFromCookie(request);

        return {
            status: 200,
            body: Json.stringify({
                project: project,
            }),
        };
      });
    });
    // api.get("/wrpc/project.listEnvironments", inflight () => {});
    api.post("/wrpc/project.rename", inflight (request) => {
      return captureUnhandledErrors(inflight () => {
        let input = Projects.RenameProjectOptions.fromJson(
          Json.parse(request.body ?? ""),
        );

        // TODO: Authorize.
        projects.rename(input);

        return {
          status: 200,
        };
      });
    });
    api.post("/wrpc/project.delete", inflight (request) => {
      return captureUnhandledErrors(inflight () => {
        let input = Projects.DeleteProjectOptions.fromJson(
          Json.parse(request.body ?? ""),
        );

        // TODO: Authorize.
        projects.delete(input);

        return {
          status: 200,
        };
      });
    });
    // api.post("/wrpc/project.changeBuildSettings", inflight () => {});
    // api.get("/wrpc/project.listEnvironmentVariables", inflight () => {});
    // api.post("/wrpc/project.updateEnvironmentVariables", inflight () => {});

    // {"name": "acme", "repository": "skyrpex/acme"}
    api.post("/wrpc/user.createProject", inflight (request) => {
      return captureUnhandledErrors(inflight () => {
        let userId = getUserFromCookie(request) ?? "";
        let body = Json.parse(request.body ?? "");

        let input = Projects.CreateProjectOptions {
          name: body.get("projectName").asStr(),
          repository: body.get("repositoryId").asStr(),
          userId: userId,
        };

        let project = projects.create(input);

        return {
          status: 200,
          body: Json.stringify({
            project: project,
          }),
        };
      });
    });

    api.get("/wrpc/user.listProjects", inflight (request) => {
      return captureUnhandledErrors(inflight () => {
        let userId = getUserFromCookie(request) ?? "";
        let input = Projects.ListProjectsOptions {
          userId: userId,
        };

        let userProjects = projects.list(input);

        return {
          status: 200,
          body: Json.stringify({
            projects: userProjects,
          }),
        };
      });
    });
    // api.get("/wrpc/user.listRepositories", inflight () => {});

    // api.post("/wrpc/signIn.callback", inflight () => {});

    // api.get("/wrpc/environment.get", inflight () => {});
    // api.post("/wrpc/environment.updateStatus", inflight () => {});
    // api.post("/wrpc/environment.generateLogsPresignedURL", inflight () => {});
  }
}
