bring cloud;
bring http;
bring ex;

bring "./reverse-proxy.w" as ReverseProxy;
bring "./users.w" as Users;
bring "./projects.w" as Projects;
bring "./api.w" as wingcloud_api;

bring "./runtime/runtime-callbacks.w" as runtime_callbacks;
bring "./runtime/runtime.w" as runtime;
bring "./probot.w" as probot;


// And the sun, and the moon, and the stars, and the flowers.

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
  githubAppClientId: inflight () => {
    return GITHUB_APP_CLIENT_ID.value();
  },
  githubAppClientSecret: inflight () => {
    return GITHUB_APP_CLIENT_SECRET.value();
  },
  appSecret: inflight () => {
    return APP_SECRET.value();
  },
);

let website = new ex.ReactApp(
  projectPath: "../website",
  startCommand: "pnpm dev --port 5174",
  buildCommand: "pnpm build",
  buildDir: "dist",
  localPort: 5174,
);


let runtimeCallbacks = new runtime_callbacks.RuntimeCallbacks();

api.post("/report", inflight (req) => {
  runtimeCallbacks.topic.publish(req.body ?? "");

  return {
    status: 200
  };
});

let rntm = new runtime.RuntimeService(api.url);
let probotApp = new probot.ProbotApp(rntm.api.url, runtimeCallbacks);
let githubApp = probotApp.githubApp;

let proxy = new ReverseProxy.ReverseProxy(
  subDomain: "dev",
  zoneName: "wingcloud.io",
  port: 5180,
  aliases: [],
  origins: [
    {
      pathPattern: "/wrpc/*",
      domainName: api.url,
      originId: "wrpc",
    },
    {
      pathPattern: "/webhook",
      domainName: githubApp.webhookUrl,
      originId: "webhook",
    },
    {
      pathPattern: "*",
      domainName: website.url,
      originId: "website",
    },
  ],
);


bring util;
if util.tryEnv("WING_TARGET") == "sim" {
  bring "./ngrok.w" as ngrok;
  let devNgrok = new ngrok.Ngrok(
    url: inflight () => {
      return proxy.url();
    }
  );

  let deploy = new cloud.OnDeploy(inflight () => {
    let url = devNgrok.waitForUrl();
    log("Website URL: " + url);

    //githubApp.updateCallbackUrl("${url}/wrpc/github.callback");
    githubApp.updateWebhookUrl("${url}/webhook");
  });
}
