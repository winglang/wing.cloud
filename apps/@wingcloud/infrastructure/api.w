bring cloud;
bring http;
bring ex;
bring util;

bring "./json-api.w" as json_api;
bring "./cookie.w" as Cookie;
bring "./github.w" as GitHub;
bring "./jwt.w" as JWT;
bring "./projects.w" as Projects;
bring "./users.w" as Users;
bring "./lowkeys-map.w" as lowkeys;

struct ApiProps {
  api: cloud.Api;
  projects: Projects.Projects;
  users: Users.Users;
  githubAppClientId: str;
  githubAppClientSecret: str;
  appSecret: str;
}

pub class Api {
  init(props: ApiProps) {
    let api = new json_api.JsonApi(api: props.api);
    let projects = props.projects;
    let users = props.users;

    let AUTH_COOKIE_NAME = "auth";

    let getJWTPayloadFromCookie = inflight (request: cloud.ApiRequest): JWT.JWTPayload? => {
      let headers = lowkeys.LowkeysMap.fromMap(request.headers ?? {});
      if let cookies = headers.tryGet("cookie") {
        let jwt = Cookie.Cookie.parse(cookies).get(AUTH_COOKIE_NAME);
        log("jwt = ${jwt}");

        return JWT.JWT.verify(
          jwt: jwt,
          secret: props.appSecret,
        );
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
          Location: "/projects",
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

    api.get("/wrpc/project.get", inflight (request) => {
      let userId = getUserFromCookie(request);

      let project = projects.get(
        id: request.query.get("id"),
      );

      if project.userId != userId {
        return {
          status: 403,
          body: {
            error: "Forbidden",
          },
        };
      }

      return {
        body: {
            project: project,
        },
      };
    });
    // api.get("/wrpc/project.listEnvironments", inflight () => {});
    api.post("/wrpc/project.rename", inflight (request) => {
      let userId = getUserFromCookie(request);

      let input = Json.parse(request.body ?? "");

      projects.rename(
        id: input.get("id").asStr(),
        name: input.get("name").asStr(),
        userId: userId,
        repository: input.get("repository").asStr(),
      );

      return {
      };
    });
    api.post("/wrpc/project.delete", inflight (request) => {
      let userId = getUserFromCookie(request);

      let input = Json.parse(request.body ?? "");

      projects.delete(
        id: input.get("id").asStr(),
        userId: userId,
        repository: input.get("repository").asStr(),
      );
    });
    // api.post("/wrpc/project.changeBuildSettings", inflight () => {});
    // api.get("/wrpc/project.listEnvironmentVariables", inflight () => {});
    // api.post("/wrpc/project.updateEnvironmentVariables", inflight () => {});

    api.post("/wrpc/user.createProject", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let userId = getUserFromCookie(request);

        log("create Project userId = ${userId}");

        let input = Json.parse(request.body ?? "");

        let gitHubLogin = users.getUsername(userId: userId);

        let commitData = GitHub.Client.getLastCommit(
          token: accessToken,
          owner:  input.get("owner").asStr(),
          repo: input.get("repositoryName").asStr(),
          default_branch: input.get("default_branch").asStr(),
        );

        let project = projects.create(
          name: input.get("projectName").asStr(),
          description: commitData?.commit?.message ?? "",
          imageUrl: input.get("imageUrl").asStr(),
          repository: input.get("repositoryId").asStr(),
          userId: userId,
          entryfile: input.get("entryfile").asStr(),
          createdAt: "${datetime.utcNow().toIso()}",
          createdBy: gitHubLogin,
        );

        return {
          body: {
            project: project,
          },
        };
      } else {
        return {
          status: 401,
        };
      }
    });

    api.get("/wrpc/user.listProjects", inflight (request) => {
      let userId = getUserFromCookie(request);

      let userProjects = projects.list(
        userId: userId,
      );

      return {
        body: {
          projects: userProjects,
        },
      };
    });
    // api.get("/wrpc/user.listRepositories", inflight () => {});

    // api.post("/wrpc/signIn.callback", inflight () => {});

    // api.get("/wrpc/environment.get", inflight () => {});
    // api.post("/wrpc/environment.updateStatus", inflight () => {});
    // api.post("/wrpc/environment.generateLogsPresignedURL", inflight () => {});
  }
}
