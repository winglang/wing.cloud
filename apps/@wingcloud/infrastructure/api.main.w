bring cloud;
bring "./projects.w" as Projects;

let projects = new Projects.Projects();

let api = new cloud.Api();

api.get("/project.get", inflight (request) => {
  // TODO: Authorize.
  let project = projects.get(
    id: request.query.get("id"),
  );
  return {
      status: 200,
      body: Json.stringify({
          project: project,
      }),
  };
});
// api.get("/project.listEnvironments", inflight () => {});
api.post("/project.rename", inflight (request) => {
  // TODO: Authorize.
  let body = Json.parse(request.body ?? "");
  projects.rename(
    id: body.get("id").asStr(),
    name: body.get("name").asStr(),
  );
  return {
    status: 200,
  };
});
api.post("/project.delete", inflight (request) => {
  // TODO: Authorize.
  let body = Json.parse(request.body ?? "");
  projects.delete(
    id: body.get("id").asStr(),
  );
  return {
    status: 200,
  };
});
// api.post("/project.changeBuildSettings", inflight () => {});
// api.get("/project.listEnvironmentVariables", inflight () => {});
// api.post("/project.updateEnvironmentVariables", inflight () => {});

// {"name": "acme", "repository": "skyrpex/acme"}
api.post("/user.createProject", inflight (request) => {
  let body = Json.parse(request.body ?? "");
  let project = projects.create(
    name: body.get("name").asStr(),
    repository: body.get("repository").asStr(),
    // TODO: Parse authentication cookie.
    userId: "user_1",
  );
  return {
    status: 200,
    body: Json.stringify({
      project: project,
    }),
  };
});
api.get("/user.listProjects", inflight () => {
  return {
    status: 200,
    body: Json.stringify({
      projects: projects.list(
        // TODO: Parse authentication cookie.
        userId: "user_1",
      ),
    }),
  };
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

  http.post("${api.url}/user.createProject", {
    body: Json.stringify({
      name: "starlight",
      repository: "starlight/starlight",
    }),
  });

  let response2 = http.get("${api.url}/user.listProjects");
  log(response2.body ?? "");
}
