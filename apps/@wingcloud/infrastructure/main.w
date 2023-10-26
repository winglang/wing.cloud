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
  flyOrgSlug: util.tryEnv("FLY_ORG_SLUG"),
);
let probotApp = new probot.ProbotApp(
  probotAppId: util.env("BOT_GITHUB_APP_ID"),
  probotSecretKey: util.env("BOT_GITHUB_PRIVATE_KEY"),
  webhookSecret: util.env("BOT_GITHUB_WEBHOOK_SECRET"),
  runtimeUrl: rntm.api.url,
  runtimeCallbacks: runtimeCallbacks,
);

bring "cdktf" as cdktf;

let apiDomainName = cdktf.Fn.trimprefix(cdktf.Fn.trimsuffix(api.url, "/prod"), "https://");
new cdktf.TerraformOutput(value: probotApp.githubApp.webhookUrl) as "Probot API URL";
// let probotApiDomainName = cdktf.Fn.trimprefix(cdktf.Fn.trimsuffix(probotApp.githubApp.webhookUrl, "/prod"), "https://");
// new cdktf.TerraformOutput(value: probotApiDomainName) as "Probot API URL 2";
let proxy = new ReverseProxy.ReverseProxy(
  subDomain: "dev",
  zoneName: "wingcloud.io",
  aliases: ["dev.wingcloud.io"],
  origins: [
    {
      pathPattern: "/wrpc/*",
      domainName: apiDomainName,
      originId: "wrpc",
      originPath: "/prod",
    },
    // {
    //   pathPattern: "/webhook",
    //   domainName: probotApiDomainName,
    //   originId: "webhook",
    // },
    {
      pathPattern: "",
      domainName: website.url.replace("https://", ""),
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
