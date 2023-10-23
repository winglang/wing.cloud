bring cloud;
bring util;
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

let wingCloudApi = new wingcloud_api.Api(
  api: api,
  projects: projects,
  users: users,
  githubAppClientId: util.env("BOT_GITHUB_CLIENT_ID"),
  githubAppClientSecret: util.env("BOT_GITHUB_CLIENT_SECRET"),
  appSecret: util.env("APP_SECRET"),
);

let websitePort = 5174;
let website = new ex.ReactApp(
  projectPath: "../website",
  startCommand: "pnpm vite --port ${websitePort}",
  buildCommand: "pnpm vite build",
  buildDir: "dist",
  localPort: websitePort,
);

let runtimeCallbacks = new runtime_callbacks.RuntimeCallbacks();

api.post("/report", inflight (req) => {
  runtimeCallbacks.topic.publish(req.body ?? "");

  return {
    status: 200
  };
});

let rntm = new runtime.RuntimeService(
  wingCloudUrl: api.url,
  flyToken: util.tryEnv("FLY_TOKEN"),
  awsAccessKeyId: util.tryEnv("AWS_ACCESS_KEY_ID"),
  awsSecretAccessKey: util.tryEnv("AWS_SECRET_ACCESS_KEY"),
);
let probotApp = new probot.ProbotApp(
  probotAppId: util.env("BOT_GITHUB_APP_ID"),
  probotSecretKey: util.env("BOT_GITHUB_PRIVATE_KEY"),
  webhookSecret: util.env("BOT_GITHUB_WEBHOOK_SECRET"),
  runtimeUrl: rntm.api.url,
  runtimeCallbacks: runtimeCallbacks,
);

let proxy = new ReverseProxy.ReverseProxy(
  subDomain: "dev",
  zoneName: "wingcloud.io",
  aliases: [],
  origins: [
    {
      pathPattern: "/wrpc/*",
      domainName: api.url,
      originId: "wrpc",
    },
    {
      pathPattern: "*",
      domainName: website.url,
      originId: "website",
    },
  ],
  port: 3900
);

if util.tryEnv("WING_TARGET") == "sim" {
  bring "./ngrok.w" as ngrok;

  let githubApp = probotApp.githubApp;
  let devNgrok = new ngrok.Ngrok(
    url: githubApp.webhookUrl,
    domain: util.tryEnv("NGROK_DOMAIN"),
  );

  let deploy = new cloud.OnDeploy(inflight () => {
    githubApp.updateWebhookUrl("${devNgrok.url}/webhook");
    log("Update your GitHub callback url to: ${proxy.url}/wrpc/github.callback");
    log("Website URL: ${proxy.url}");
  });
}
