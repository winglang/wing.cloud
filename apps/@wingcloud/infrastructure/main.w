// And the sun, and the moon, and the stars, and the flowers.
bring cloud;
bring ex;
bring util;
bring http;
bring expect;

bring "cdktf" as cdktf;

bring "@winglibs/vite" as vite;

bring "./users.w" as Users;
bring "./apps.w" as Apps;
bring "./environments.w" as Environments;
bring "./endpoints.w" as Endpoints;
bring "./environment-manager.w" as EnvironmentManager;
bring "./environment-cleaner.w" as EnvironmentCleaner;
bring "./secrets.w" as Secrets;
bring "./api.w" as wingcloud_api;
bring "./segment-analytics.w" as SegmentAnalytics;
bring "./authenticated-websocket-server.w" as wsServer;

bring "./runtime/runtime.w" as runtime;
bring "./runtime/runtime-client.w" as runtime_client;
bring "./probot.w" as probot;
bring "./probot-adapter.w" as adapter;
bring "./components/parameter/parameter.w" as parameter;
bring "./components/dns/dns.w" as Dns;
bring "./components/public-endpoint/public-endpoint.w" as PublicEndpoint;
bring "./components/certificate/certificate.w" as certificate;
bring "./patches/react-app.patch.w" as reactAppPatch;
bring "./google-oauth.w" as google_oauth;

if util.tryEnv("WING_IS_TEST") != "true" {
  // Wing Tunnels
  bring "./node_modules/@wingcloud/tunnels/src/tunnels.w" as tunnels;
  let tunnelsSubdomain = (() => {
    let var subDomain = util.tryEnv("TUNNELS_SUBDOMAIN");
    if subDomain? && subDomain != "" {
      return "{subDomain}";
    } else {
      return "endpoints";
    }
  })();
  new tunnels.TunnelsApi(zoneName: "wingcloud.dev", subDomain: tunnelsSubdomain);
}

let appSecret = util.env("APP_SECRET");
let wsSecret = util.env("WS_SECRET");
let segmentWriteKey = util.tryEnv("SEGMENT_WRITE_KEY") ?? "";
let enableAnalytics = util.env("ENABLE_ANALYTICS") == "true" && segmentWriteKey != "";

let publicEndpointDomain = (): str => {
  if util.env("WING_TARGET") == "sim" {
    return "127.0.0.1";
  } else {
    return util.env("PUBLIC_ENDPOINT_DOMAIN");
  }
}();
let publicEndpointSubdomain = (): str? => {
  if let subdomain = util.tryEnv("PUBLIC_ENDPOINT_SUBDOMAIN") {
    if subdomain != "" {
      return subdomain;
    }
  }

  return nil;
}();
let publicEndpointFullDomainName = (): str => {
  if let subdomain = publicEndpointSubdomain {
    return "{subdomain}.{publicEndpointDomain}";
  } else {
    return publicEndpointDomain;
  }
}();

let analytics = new SegmentAnalytics.SegmentAnalytics(segmentWriteKey, enableAnalytics);

let api = new cloud.Api(
  cors: true,
  corsOptions: cloud.ApiCorsOptions {
    allowOrigin: ["*"],
  }
) as "wrpc";

let apiUrlParam = new parameter.Parameter(
  name: "api-url",
  value: api.url,
) as "wrpc-url";

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
let ws = new wsServer.AuthenticatedWebsocketServer(secret: wsSecret) as "WebsocketServer";

let probotAdapter = new adapter.ProbotAdapter(
  probotAppId: util.env("BOT_GITHUB_APP_ID"),
  probotSecretKey: util.env("BOT_GITHUB_PRIVATE_KEY"),
  webhookSecret: util.env("BOT_GITHUB_WEBHOOK_SECRET"),
);

let bucketLogs = new cloud.Bucket() as "deployment logs";

let runtimeApi = new cloud.Api() as "runtime";
let runtimeUrlParam = new parameter.Parameter(
  name: "runtime-url",
  value: runtimeApi.url,
) as "runtime-service-url";

let siteURL = (() => {
  if util.env("WING_TARGET") == "tf-aws" {
    let var subDomain = util.tryEnv("PROXY_SUBDOMAIN");
    if subDomain? && subDomain != "" {
      subDomain = "{subDomain}.";
    }
    let zoneName = util.env("PROXY_ZONE_NAME");
    return "https://{subDomain}{zoneName}";
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

let endpointProvider = new PublicEndpoint.PublicEndpointProvider(
  dns: dns,
  domain: publicEndpointDomain,
  subdomain: publicEndpointSubdomain
);

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
  runtimeClient: new runtime_client.RuntimeClient(runtimeUrl: runtimeUrlParam),
  probotAdapter: probotAdapter,
  siteDomain: siteURL,
  analytics: analytics,
  logs: bucketLogs,
);

if util.tryEnv("WING_IS_TEST") != "true" {
  let rntm = new runtime.RuntimeService(
    api: runtimeApi,
    wingCloudUrl: apiUrlParam,
    flyToken: util.tryEnv("FLY_TOKEN"),
    flyOrgSlug: util.tryEnv("FLY_ORG_SLUG"),
    environments: environments,
    environmentManager: environmentManager,
    logs: bucketLogs,
    publicEndpointFullDomainName: publicEndpointFullDomainName,
  );
}

let dashboard = new vite.Vite(
  root: "../website",
  publicEnv: {
    "SEGMENT_WRITE_KEY": segmentWriteKey,
    "ENABLE_ANALYTICS": "{enableAnalytics}",
    "API_URL": "{api.url}",
    "WS_URL": "{ws.url}",
    "GITHUB_APP_CLIENT_ID": util.env("BOT_GITHUB_CLIENT_ID"),
    "GITHUB_APP_NAME": util.env("BOT_GITHUB_APP_NAME"),
  },
) as "website";

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
  githubAppCallbackOrigin: util.env("BOT_GITHUB_CALLBACK_ORIGIN"),
  appSecret: appSecret,
  wsSecret: wsSecret,
  logs: bucketLogs,
  analytics: analytics,
  segmentWriteKey: segmentWriteKey,
);

new google_oauth.GoogleOAuth(
  api: wingCloudApi.api,
  credentials: {
    clientId: util.env("GOOGLE_OAUTH_CLIENT_ID"),
    clientSecret: util.env("GOOGLE_OAUTH_CLIENT_SECRET"),
  },
  redirectOrigin: util.env("GOOGLE_OAUTH_REDIRECT_ORIGIN"),
  analytics: analytics,
);

let probotApp = new probot.ProbotApp(
  probotAdapter: probotAdapter,
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
      subDomain: util.tryEnv("PROXY_SUBDOMAIN"),
    ) as "wing proxy";

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

new cloud.Endpoint(proxyUrl, browserSupport: true) as "Proxy Endpoint";

if util.tryEnv("WING_TARGET") == "sim" && util.tryEnv("WING_IS_TEST") != "true" {
  bring "./node_modules/@wingcloud/ngrok/index.w" as ngrok;

  let devNgrok = new ngrok.Ngrok(
    url: probotApp.githubApp.api.url,
    domain: util.tryEnv("NGROK_DOMAIN"),
  );
}
if util.tryEnv("WING_TARGET") != "sim" {
  let webhookUrl = probotApp.githubApp.api.url;
  let updateGithubWebhook = inflight () => {
    probotApp.githubApp.updateWebhookUrl("{webhookUrl}/webhook");
    log("Update your GitHub callback url to: {proxyUrl}/wrpc/github.callback");
  };
  new cloud.OnDeploy(updateGithubWebhook);
}

new EnvironmentCleaner.EnvironmentCleaner(apps: apps, environmentManager: environmentManager, environments: environments);

// Smoke Tests
api.get("/wrpc/health", inflight () => {
  return {
    status: 200,
  };
});

new cdktf.TerraformOutput(value: api.url) as "API URL";
new cdktf.TerraformOutput(value: dashboard.url) as "Dashboard URL";
new cdktf.TerraformOutput(value: probotApp.githubApp.api.url) as "Probot API URL";
new cdktf.TerraformOutput(value: proxyUrl) as "Proxy URL";
new cdktf.TerraformOutput(value: siteURL) as "Site URL";

test "API Health Check" {
  let response = http.get("{api.url}/wrpc/health");
  expect.equal(response.status, 200);
}
