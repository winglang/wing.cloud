bring cloud;
bring http;
bring ex;

bring "./cookie.w" as Cookie;
bring "./github.w" as GitHub;
bring "./jwt.w" as JWT;
bring "./projects.w" as Projects;
bring "./users.w" as Users;

let table = new ex.DynamodbTable(
  name: "data",
  attributeDefinitions: {
    "pk": "S",
    "sk": "S",
  },
  hashKey: "pk",
  rangeKey: "sk",
);
let projects = new Projects.Projects(table);
let users = new Users.Users(table);

let api = new cloud.Api();

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

let GITHUB_APP_CLIENT_ID = new cloud.Secret(name: "wing.cloud/GITHUB_APP_CLIENT_ID") as "GITHUB_APP_CLIENT_ID";
let GITHUB_APP_CLIENT_SECRET = new cloud.Secret(name: "wing.cloud/GITHUB_APP_CLIENT_SECRET") as "GITHUB_APP_CLIENT_SECRET";
let APP_SECRET = new cloud.Secret(name: "wing.cloud/APP_SECRET") as "APP_SECRET";

let AUTH_COOKIE_NAME = "auth";

// https://github.com/login/oauth/authorize?client_id=Iv1.29ba054d6e919d9c
api.get("/github.callback", inflight (request) => {
  return captureUnhandledErrors(inflight () => {
    let code = request.query.get("code");

    let tokens = GitHub.Exchange.codeForTokens(
      code: code,
      clientId: GITHUB_APP_CLIENT_ID.value(),
      clientSecret: GITHUB_APP_CLIENT_SECRET.value(),
    );
    log("tokens = ${Json.stringify(tokens)}");

    let gitHubLogin = GitHub.Exchange.getLoginFromAccessToken(tokens.access_token);
    log("gitHubLogin = ${gitHubLogin}");
    let userId = users.getOrCreate(gitHubLogin: gitHubLogin);
    log("userId = ${userId}");

    let jwt = JWT.JWT.sign(
      userId: userId,
      tokens: tokens,
      secret: APP_SECRET.value(),
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
      status: 200,
      headers: {
        "Set-Cookie": authCookie,
      },
    };
  });
});

let getJWTPayloadFromCookie = inflight (request: cloud.ApiRequest): JWT.JWTPayload? => {
  if let cookies = request.headers?.get("Cookie") {
    let jwt = Cookie.Cookie.parse(cookies).get(AUTH_COOKIE_NAME);
    log("jwt = ${jwt}");

    return JWT.JWT.verify(
      jwt: jwt,
      secret: APP_SECRET.value(),
    );
  }

};

let getUserFromCookie = inflight (request: cloud.ApiRequest) => {
  let payload = getJWTPayloadFromCookie(request);
  return payload?.userId;
};

api.get("/project.get", inflight (request) => {
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
// api.get("/project.listEnvironments", inflight () => {});
api.post("/project.rename", inflight (request) => {
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
api.post("/project.delete", inflight (request) => {
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
// api.post("/project.changeBuildSettings", inflight () => {});
// api.get("/project.listEnvironmentVariables", inflight () => {});
// api.post("/project.updateEnvironmentVariables", inflight () => {});

// {"name": "acme", "repository": "skyrpex/acme"}
api.post("/user.createProject", inflight (request) => {
  return captureUnhandledErrors(inflight () => {
    let body = Json.parse(request.body ?? "");
    let input = Projects.CreateProjectOptions {
      name: body.get("name").asStr(),
      repository: body.get("repository").asStr(),
      // TODO: Parse authentication cookie.
      userId: "user_1",
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
api.get("/user.listProjects", inflight () => {
  return captureUnhandledErrors(inflight () => {
    let input = Projects.ListProjectsOptions {
      // TODO: Parse authentication cookie.
      userId: "user_1",
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
// api.get("/user.listRepositories", inflight () => {});

// api.post("/signIn.callback", inflight () => {});

// api.get("/environment.get", inflight () => {});
// api.post("/environment.updateStatus", inflight () => {});
// api.post("/environment.generateLogsPresignedURL", inflight () => {});

test "Test API" {
  let response = http.post("${api.url}/user.createProject", {
    body: Json.stringify({
      name: "acme",
      repository: "skyrpex/acme",
    }),
  });
  let projectId = Json.parse(response.body ?? "").get("project").get("id").asStr();
  log("projectId = ${projectId}");

  let renameResponse = http.post("${api.url}/project.rename", {
    body: Json.stringify({
      id: projectId,
      name: "test",
    }),
  });
  log(renameResponse.body ?? "");

  http.post("${api.url}/user.createProject", {
    body: Json.stringify({
      name: "starlight",
      repository: "starlight/starlight",
    }),
  });

  let response2 = http.get("${api.url}/user.listProjects");
  log(response2.body ?? "");
}

test "Rename project" {
  let response = http.post("${api.url}/user.createProject", {
    body: Json.stringify({
      name: "acme",
      repository: "skyrpex/acme",
    }),
  });
  let projectId = Json.parse(response.body ?? "").get("project").get("id").asStr();
  log("projectId = ${projectId}");

  let renameResponse = http.post("${api.url}/project.rename", {
    body: Json.stringify({
      id: projectId,
      name: "test",
    }),
  });
  log(renameResponse.body ?? "");
}
