bring cloud;
bring http;
bring ex;
bring util;
bring "./runtime/runtime-callbacks.w" as runtime_callbacks;
bring "./runtime/runtime.w" as runtime;
bring "./probot.w" as probot;

bring "./reverse-proxy-sim.w" as ReverseProxy;
bring "./users.w" as Users;
bring "./projects.w" as Projects;
bring "./api.w" as wingcloud_api;

// And the sun, and the moon, and the stars, and the flowers.

struct WebsiteFiles {
  cwd: str;
  files: Array<str>;
}

let runtimeCallbacks = new runtime_callbacks.RuntimeCallbacks();

let wingApi = new cloud.Api() as "wing api";
wingApi.post("/report", inflight (req) => {
  runtimeCallbacks.topic.publish(req.body ?? "");

  return {
    status: 200
  };
});

let rntm = new runtime.RuntimeService(wingApi.url);
new probot.ProbotApp(rntm.api.url, runtimeCallbacks);


let api = new cloud.Api(
  cors: true,
  corsOptions: cloud.ApiCorsOptions {
    allowOrigin: ["*"],
  }
);

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
let GITHUB_APP_CLIENT_ID = new cloud.Secret(name: "wing.cloud/GITHUB_APP_CLIENT_ID") as "GITHUB_APP_CLIENT_ID";
let GITHUB_APP_CLIENT_SECRET = new cloud.Secret(name: "wing.cloud/GITHUB_APP_CLIENT_SECRET") as "GITHUB_APP_CLIENT_SECRET";
let APP_SECRET = new cloud.Secret(name: "wing.cloud/APP_SECRET") as "APP_SECRET";


let wingCloudApi = new wingcloud_api.Api(
  api: api,
  projects: projects,
  users: users,
  githubAppClientId: GITHUB_APP_CLIENT_ID.value,
  githubAppClientSecret: GITHUB_APP_CLIENT_SECRET.value,
  appSecret: APP_SECRET.value
);


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

let website = new ex.ReactApp(
  projectPath: "../website",
  startCommand: "pnpm dev --port 5174",
  buildCommand: "pnpm build",
  localPort: 5174,
);

let proxy = new ReverseProxy.ReverseProxy(
  origins: [
    {
      pathPattern: "/wrpc/*",
      domainName: api.url,
    },
    {
      pathPattern: "*",
      domainName: website.url,
    },
  ],
);

bring "./ngrok2.w" as Ngrok;

let ngrok = new Ngrok.Ngrok(
  url: inflight () => {
    return proxy.url();
  },
  domain: util.tryEnv("NGROK_DOMAIN"),
);

new cloud.Service(inflight () => {
  log("Proxy URL: ${proxy.url()}");
  log("Ngrok URL: ${ngrok.waitForUrl()}");
}) as "Log URLs Service";

