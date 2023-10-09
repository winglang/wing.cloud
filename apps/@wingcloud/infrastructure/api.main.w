bring cloud;
bring http;

bring "./cookie.w" as Cookie;
bring "./github.w" as GitHub;
bring "./jwt.w" as JWT;
bring "./projects.w" as Projects;

let projects = new Projects.Projects();

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

struct GitHubCallbackOptions {
  code: str;
  // installation_id: str?;
  // setup_action: str?;
}

api.get("/github.callback", inflight (request) => {
  return captureUnhandledErrors(inflight () => {
    let input = GitHubCallbackOptions {
      code: request.query.get("code"),
      // installation_id: request.query.get("installation_id"),
      // setup_action: request.query.get("setup_action"),
    };

    let tokens = GitHub.Exchange.codeForTokens(
      code: input.code,
      clientId: GITHUB_APP_CLIENT_ID.value(),
      clientSecret: GITHUB_APP_CLIENT_SECRET.value(),
    );

    // TODO: Get or create user.
    // let userId = getorCreateUser(...);
    let userId = "user_1";

    let jwt = JWT.JWT.sign(
      userId: userId,
      tokens: tokens,
      secret: APP_SECRET.value(),
    );

    let authCookie = Cookie.Cookie.serialize(
      "auth",
      jwt,
      {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      },
    );

    return {
      status: 200,
      body: Json.stringify({

      }),
      headers: {
        "Set-Cookie": authCookie,
      },
    };
  });
});

api.get("/project.get", inflight (request) => {
  return captureUnhandledErrors(inflight () => {
    let input = Projects.GetProjectOptions.fromJson(request.query);

    // TODO: Authorize.
    let project = projects.get(input);

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
