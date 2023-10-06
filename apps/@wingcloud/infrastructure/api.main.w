bring cloud;
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

bring http;

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
