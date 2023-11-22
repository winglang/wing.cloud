bring cloud;
bring util;
bring http;
bring ex;
bring "cdktf" as cdktf;

bring "./reverse-proxy.w" as ReverseProxy;
bring "./users.w" as Users;
bring "./apps.w" as Apps;
bring "./environments.w" as Environments;
bring "./environment-manager.w" as EnvironmentManager;
bring "./secrets.w" as Secrets;
bring "./api.w" as wingcloud_api;

bring "./runtime/runtime.w" as runtime;
bring "./runtime/runtime-client.w" as runtime_client;
bring "./probot.w" as probot;
bring "./probot-adapter.w" as adapter;
bring "./cloudfront.w" as cloudFront;
bring "./components/parameter/parameter.w" as parameter;
bring "./patches/react-app.patch.w" as reactAppPatch;

// And the sun, and the moon, and the stars, and the flowers.
let appSecret = util.env("APP_SECRET");

let DEFAULT_STAGING_LANDING_DOMAIN = "wing-cloud-staging-dev-only.webflow.io";

let api = new cloud.Api(
  cors: true,
  corsOptions: cloud.ApiCorsOptions {
    allowOrigin: ["*"],
  }
);

let apiUrlParam = new parameter.Parameter(
  name: "api-url",
  value: api.url,
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
let secrets = new Secrets.Secrets();

let probotAdapter = new adapter.ProbotAdapter(
  probotAppId: util.env("BOT_GITHUB_APP_ID"),
  probotSecretKey: util.env("BOT_GITHUB_PRIVATE_KEY"),
  webhookSecret: util.env("BOT_GITHUB_WEBHOOK_SECRET"),
);

let bucketLogs = new cloud.Bucket() as "deployment logs";

let rntm = new runtime.RuntimeService(
  wingCloudUrl: apiUrlParam,
  flyToken: util.tryEnv("FLY_TOKEN"),
  flyOrgSlug: util.tryEnv("FLY_ORG_SLUG"),
  environments: environments,
  logs: bucketLogs,
);

let websitePort = 5174;
let website = new ex.ReactApp(
  projectPath: "../website",
  startCommand: "pnpm vite --port ${websitePort}",
  buildCommand: "pnpm vite build",
  buildDir: "dist",
  localPort: websitePort,
);

reactAppPatch.ReactAppPatch.apply(website);

let var siteDomain = util.tryEnv("STAGING_LANDING_DOMAIN") ?? DEFAULT_STAGING_LANDING_DOMAIN;
if util.env("WING_TARGET") == "sim" {
  siteDomain = website.url;
}

let environmentManager = new EnvironmentManager.EnvironmentManager(
  apps: apps,
  environments: environments,
  secrets: secrets,
  runtimeClient: new runtime_client.RuntimeClient(runtimeUrl: rntm.api.url),
  probotAdapter: probotAdapter,
  siteDomain: siteDomain
);

let wingCloudApi = new wingcloud_api.Api(
  api: api,
  apps: apps,
  users: users,
  environments: environments,
  environmentManager: environmentManager,
  secrets: secrets,
  probotAdapter: probotAdapter,
  githubAppClientId: util.env("BOT_GITHUB_CLIENT_ID"),
  githubAppClientSecret: util.env("BOT_GITHUB_CLIENT_SECRET"),
  appSecret: appSecret,
  logs: bucketLogs,
);

let probotApp = new probot.ProbotApp(
  probotAdapter: probotAdapter,
  runtimeUrl: rntm.api.url,
  environments: environments,
  apps: apps,
  environmentManager: environmentManager,
  siteDomain: siteDomain
);

let apiDomainName = (() => {
  if util.env("WING_TARGET") == "tf-aws" {
    // See https://github.com/winglang/wing/issues/4688.
    return cdktf.Fn.trimprefix(cdktf.Fn.trimsuffix(api.url, "/prod"), "https://");
  }
  return api.url;
})();
let subDomain = util.env("PROXY_SUBDOMAIN");
let zoneName = util.env("PROXY_ZONE_NAME");
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
      pathPattern: "/apps/*",
      domainName: website.url.replace("https://", ""),
      originId: "website",
    });
    originsArray.push({
      pathPattern: "",
      domainName: util.tryEnv("STAGING_LANDING_DOMAIN") ?? DEFAULT_STAGING_LANDING_DOMAIN,
      originId: "landingPage",
    });
  }
  return originsArray.copy();
})();
let proxy = new ReverseProxy.ReverseProxy(
  subDomain: subDomain,
  zoneName: zoneName,
  aliases: ["${subDomain}.${zoneName}"],
  origins: origins,
  port: (): num? => {
    if util.tryEnv("WING_IS_TEST") == "true" {
      return nil;
    } else {
      return 3900;
    }
  }()
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

let updateGithubWebhook = inflight () => {
  probotApp.githubApp.updateWebhookUrl("${webhookUrl}/webhook");
  log("Update your GitHub callback url to: ${proxy.url}/wrpc/github.callback");
};

let deploy = new cloud.OnDeploy(updateGithubWebhook);

bring "./tests/environments.w" as tests;
new tests.EnvironmentsTest(
  users: users,
  apps: apps,
  environments: environments,
  githubApp: probotApp.githubApp,
  updateGithubWebhook: updateGithubWebhook,
  appSecret: appSecret,
  wingCloudUrl: apiUrlParam,
  githubToken: util.tryEnv("TESTS_GITHUB_TOKEN"),
  githubOrg: util.tryEnv("TESTS_GITHUB_ORG"),
  githubUser: util.tryEnv("TESTS_GITHUB_USER"),
);

new cdktf.TerraformOutput(value: api.url) as "API URL";
new cdktf.TerraformOutput(value: website.url) as "Website URL";
new cdktf.TerraformOutput(value: probotApp.githubApp.webhookUrl) as "Probot API URL";
new cdktf.TerraformOutput(value: proxy.url) as "Proxy URL";
