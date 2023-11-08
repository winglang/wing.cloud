bring cloud;
bring util;
bring http;
bring ex;

bring "./reverse-proxy.w" as ReverseProxy;
bring "./users.w" as Users;
bring "./apps.w" as Apps;
bring "./environments.w" as Environments;
bring "./api.w" as wingcloud_api;

bring "./runtime/runtime-callbacks.w" as runtime_callbacks;
bring "./runtime/runtime.w" as runtime;
bring "./probot.w" as probot;
bring "./cloudfront.w" as cloudFront;

// And the sun, and the moon, and the stars, and the flowers.

let DEFAULT_STAGING_LANDING_DOMAIN = "wing-cloud-staging-dev-only.webflow.io";

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
let apps = new Apps.Apps(table);
let users = new Users.Users(table);
let environments = new Environments.Environments(table);

let wingCloudApi = new wingcloud_api.Api(
  api: api,
  apps: apps,
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
  environments: environments,
);
let probotApp = new probot.ProbotApp(
  probotAppId: util.env("BOT_GITHUB_APP_ID"),
  probotSecretKey: util.env("BOT_GITHUB_PRIVATE_KEY"),
  webhookSecret: util.env("BOT_GITHUB_WEBHOOK_SECRET"),
  runtimeUrl: rntm.api.url,
  runtimeCallbacks: runtimeCallbacks,
  environments: environments,
  apps: apps,
);
bring "cdktf" as cdktf;
new cdktf.TerraformOutput(value: probotApp.githubApp.webhookUrl) as "Probot API URL";

let apiDomainName = (() => {
  if util.env("WING_TARGET") == "tf-aws" {
    // See https://github.com/winglang/wing/issues/4688.
    return cdktf.Fn.trimprefix(cdktf.Fn.trimsuffix(api.url, "/prod"), "https://");
  }
  return api.url;
})();
let subDomain = util.env("PROXY_SUBDOMAIN");
let zoneName = util.env("PROXY_ZONE_NAME");;
//https://github.com/winglang/wing/issues/221
let origins = (() => {
  let originsArray = MutArray<cloudFront.Origin>[
    {
      pathPattern: "/wrpc/*",
      domainName: apiDomainName,
      originId: "wrpc",
      originPath: "/prod",
    },
  ];
  if util.env("WING_TARGET") == "sim" {
    originsArray.push({
      pathPattern: "",
      domainName: website.url.replace("https://", ""),
      originId: "website",
    });
  } else {
    originsArray.push({
      pathPattern: "",
      domainName: util.tryEnv("STAGING_LANDING_DOMAIN") ?? DEFAULT_STAGING_LANDING_DOMAIN,
      originId: "landingPage",
    });
    originsArray.push({
      pathPattern: "/*",
      domainName: website.url.replace("https://", ""),
      originId: "website",
    });
  }
  return originsArray.copy();
})();
let proxy = new ReverseProxy.ReverseProxy(
  subDomain: subDomain,
  zoneName: zoneName,
  aliases: ["${subDomain}.${zoneName}"],
  origins: origins,
  port: 3900
);

let var webhookUrl = probotApp.githubApp.webhookUrl;
if util.tryEnv("WING_TARGET") == "sim" {
  bring "./ngrok.w" as ngrok;

  let devNgrok = new ngrok.Ngrok(
    url: webhookUrl,
    domain: util.tryEnv("NGROK_DOMAIN"),
  );

  webhookUrl = devNgrok.url;
}

let deploy = new cloud.OnDeploy(inflight () => {
  probotApp.githubApp.updateWebhookUrl("${webhookUrl}/webhook");
  log("Update your GitHub callback url to: ${proxy.url}/wrpc/github.callback");
});

bring "./tests/environments.w" as tests;
new tests.EnvironmentsTest(
  users: users,
  apps: apps,
  environments: environments,
  githubToken: util.tryEnv("TESTS_GITHUB_TOKEN"),
  githubOrg: util.tryEnv("TESTS_GITHUB_ORG"),
  githubUser: util.tryEnv("TESTS_GITHUB_USER"),
);

