// And the sun, and the moon, and the stars, and the flowers.
bring cloud;
bring util;
bring http;
bring ex;
bring websockets;

bring "cdktf" as cdktf;

bring "./users.w" as Users;
bring "./apps.w" as Apps;
bring "./environments.w" as Environments;
bring "./endpoints.w" as Endpoints;
bring "./environment-manager.w" as EnvironmentManager;
bring "./secrets.w" as Secrets;
bring "./api.w" as wingcloud_api;
bring "./segment-analytics.w" as SegmentAnalytics;

bring "./runtime/runtime.w" as runtime;
bring "./runtime/runtime-client.w" as runtime_client;
bring "./probot.w" as probot;
bring "./probot-adapter.w" as adapter;
bring "./components/parameter/parameter.w" as parameter;
bring "./components/dns/dns.w" as Dns;
bring "./components/public-endpoint/public-endpoint.w" as PublicEndpoint;
bring "./components/certificate/certificate.w" as certificate;
bring "./patches/react-app.patch.w" as reactAppPatch;

let appSecret = util.env("APP_SECRET");
let segmentWriteKey = util.env("SEGMENT_WRITE_KEY");
let enableAnalytics = util.env("ENABLE_ANALYTICS") == "true";

let analytics = new SegmentAnalytics.SegmentAnalytics(segmentWriteKey, enableAnalytics);

let ws = new websockets.WebSocket(name: "MyWebSocket") as "my-websocket";

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
let endpoints = new Endpoints.Endpoints(table);

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

let dashboardPort = 5174;
let dashboard = new ex.ReactApp(
  projectPath: "../website",
  startCommand: "pnpm vite --port {dashboardPort}",
  buildCommand: "pnpm vite build",
  buildDir: "dist",
  localPort: dashboardPort,
);
dashboard.addEnvironment("SEGMENT_WRITE_KEY", segmentWriteKey);
dashboard.addEnvironment("ENABLE_ANALYTICS", "{enableAnalytics}");

reactAppPatch.ReactAppPatch.apply(dashboard);

let siteURL = (() => {
  if util.env("WING_TARGET") == "tf-aws" {
    let subDomain = util.env("PROXY_SUBDOMAIN");
    let zoneName = util.env("PROXY_ZONE_NAME");
    return "https://{subDomain}.{zoneName}";
  } else {
    return "http://localhost:3900";
  }
})();

let dns = new Dns.DNS(token: (): str? => {
  if util.env("WING_TARGET") != "sim" {
    return util.env("DNSIMPLE_TOKEN");
  } else {
    return nil;
  }
}());
let endpointProvider = new PublicEndpoint.PublicEndpointProvider(dns: dns, domain: (): str => {
  if util.env("WING_TARGET") == "sim" {
    return "127.0.0.1";
  } else {
    return "wingcloud.io";
  }
}());

let environmentServerCertificate = new certificate.Certificate(
  privateKeyFile: (): str => {
    if util.env("WING_TARGET") == "sim" {
      return util.env("ENVIRONMENT_SERVER_PRIVATE_KEY_FILE");
    }
  }(),
  certificateFile: (): str => {
    if util.env("WING_TARGET") == "sim" {
      return util.env("ENVIRONMENT_SERVER_CERTIFICATE_FILE");
    }
  }(),
  certificateId: (): num => {
    if util.env("WING_TARGET") != "sim" {
      return num.fromStr(util.env("ENVIRONMENT_SERVER_CERTIFICATE_ID"));
    }
  }(),
  domain: (): str => {
    if util.env("WING_TARGET") != "sim" {
      return util.env("ENVIRONMENT_SERVER_ZONE_NAME");
    }
  }(),
);

let environmentManager = new EnvironmentManager.EnvironmentManager(
  users: users,
  apps: apps,
  environments: environments,
  secrets: secrets,
  endpoints: endpoints,
  endpointProvider: endpointProvider,
  certificate: environmentServerCertificate,
  runtimeClient: new runtime_client.RuntimeClient(runtimeUrl: rntm.api.url),
  probotAdapter: probotAdapter,
  siteDomain: siteURL,
  analytics: analytics
);

let wingCloudApi = new wingcloud_api.Api(
  api: api,
  ws: ws,
  apps: apps,
  users: users,
  environments: environments,
  environmentManager: environmentManager,
  secrets: secrets,
  endpoints: endpoints,
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
  users: users,
  apps: apps,
  environmentManager: environmentManager,
  siteDomain: siteURL,
);

let apiDomainName = (() => {
  if util.env("WING_TARGET") == "tf-aws" {
    // See https://github.com/winglang/wing/issues/4688.
    return cdktf.Fn.trimprefix(cdktf.Fn.trimsuffix(api.url, "/prod"), "https://");
  }
  return api.url;
})();

let getDomainName = (url: str): str => {
  // See https://github.com/winglang/wing/issues/4688.
  return cdktf.Fn.trimprefix(url, "https://");
};

let proxyUrl = (() => {
  if util.env("WING_TARGET") == "tf-aws" {
    bring "./website-proxy.w" as website_proxy;

    let proxy = new website_proxy.WebsiteProxy(
      apiOrigin: {
        domainName: apiDomainName,
        pathPattern: "/wrpc/*",
        originPath: "/prod",
      },
      landingDomainName: util.env("LANDING_DOMAIN"),
      dashboardDomainName: getDomainName(dashboard.url),
      zoneName: util.env("PROXY_ZONE_NAME"),
      subDomain: util.env("PROXY_SUBDOMAIN"),
    );

    return proxy.url;
  } elif util.env("WING_TARGET") == "sim" {
    bring "./reverse-proxy.w" as reverse_proxy;

    let proxy = new reverse_proxy.ReverseProxy(
      origins: [
        {
          pathPattern: "/wrpc/*",
          domainName: apiDomainName,
        },
        {
          pathPattern: "/ws/*",
          domainName: ws.url(),
        },
        {
          pathPattern: "*",
          domainName: dashboard.url,
        },
      ],
      port: (): num? => {
        if util.tryEnv("WING_IS_TEST") == "true" {
          return nil;
        } else {
          return 3900;
        }
      }(),
    );

    return proxy.url;
  } else {
    throw "Unknown WING_TARGET: {util.env("WING_TARGET")}";
  }
})();

let var webhookUrl = probotApp.githubApp.webhookUrl;
if util.tryEnv("WING_TARGET") == "sim" {
  bring "./node_modules/@wingcloud/ngrok/index.w" as ngrok;

  let devNgrok = new ngrok.Ngrok(
    url: webhookUrl,
    domain: util.tryEnv("NGROK_DOMAIN"),
  );

  webhookUrl = devNgrok.url;
}

let updateGithubWebhook = inflight () => {
  probotApp.githubApp.updateWebhookUrl("{webhookUrl}/webhook");
  log("Update your GitHub callback url to: {proxyUrl}/wrpc/github.callback");
};

new cloud.OnDeploy(updateGithubWebhook);

new cdktf.TerraformOutput(value: api.url) as "API URL";
new cdktf.TerraformOutput(value: dashboard.url) as "Dashboard URL";
new cdktf.TerraformOutput(value: probotApp.githubApp.webhookUrl) as "Probot API URL";
new cdktf.TerraformOutput(value: proxyUrl) as "Proxy URL";
new cdktf.TerraformOutput(value: siteURL) as "Site URL";
