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

let subDomain = util.env("PROXY_SUBDOMAIN");
let zoneName = util.env("PROXY_ZONE_NAME");

let var siteDomain = "https://${subDomain}.${zoneName}";
if util.env("WING_TARGET") == "sim" {
  siteDomain = "http://localhost:3900";
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

let getDomainName = (url: str): str => {
  // See https://github.com/winglang/wing/issues/4688.
  return cdktf.Fn.trimprefix(url, "https://");
};

let proxyUrl = (() => {
  if util.env("WING_TARGET") == "tf-aws" {
    bring "./dnsimple.w" as DNSimple;
    bring "@cdktf/provider-aws" as aws;

    // See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html#managed-cache-caching-optimized.
    let cachingOptimizedCachePolicyId = "658327ea-f89d-4fab-a63d-7e88639e58f6";

    let passthroughCachePolicy = new aws.cloudfrontCachePolicy.CloudfrontCachePolicy(
      name: "passthrough-cache-policy",
      defaultTtl: 0m.seconds,
      minTtl: 0m.seconds,
      maxTtl: 1s.seconds,
      parametersInCacheKeyAndForwardedToOrigin: {
        cookiesConfig: {
          // Needed to authenticate the API calls.
          cookieBehavior: "all"
        },
        headersConfig: {
          headerBehavior: "none",
        },
        queryStringsConfig: {
          // Needed for many API endpoints.
          queryStringBehavior: "all",
        },
      },
    );

    let shortCachePolicy = new aws.cloudfrontCachePolicy.CloudfrontCachePolicy(
      name: "short-cache-policy",
      defaultTtl: 1m.seconds,
      minTtl: 1m.seconds,
      maxTtl: 10m.seconds,
      parametersInCacheKeyAndForwardedToOrigin: {
        cookiesConfig: {
          cookieBehavior: "none"
        },
        headersConfig: {
          headerBehavior: "none",
        },
        queryStringsConfig: {
          queryStringBehavior: "none",
        },
      },
    ) as "short-cache-policy";

    let certificate = new DNSimple.DNSimpleValidatedCertificate(
      zoneName: zoneName,
      subDomain: subDomain,
    );

    let distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
      enabled: true,
      viewerCertificate: {
        acmCertificateArn: certificate.certificate.certificate.arn,
        sslSupportMethod: "sni-only",
      },
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
        },
      },
      origin: [
        {
          originId: "api",
          domainName: apiDomainName,
          pathPattern: "/wrpc/*",
          originPath: "/prod",
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"],
          },
        },
        {
          originId: "landing",
          domainName: util.env("LANDING_DOMAIN"),
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"],
          },
        },
        {
          originId: "dashboard",
          domainName: getDomainName(website.url),
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"],
          },
        },
      ],
      originGroup: [
        {
          originId: "landing_dashboard",
          failoverCriteria: {
            statusCodes: [403],
          },
          member: [
            {
              originId: "landing",
            },
            {
              originId: "dashboard",
            },
          ],
        },
      ],
      orderedCacheBehavior: [
        {
          targetOriginId: "api",
          pathPattern: "/wrpc/*",
          allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
          cachedMethods: ["GET", "HEAD", "OPTIONS"],
          viewerProtocolPolicy: "redirect-to-https",
          cachePolicyId: passthroughCachePolicy.id,
        },
        {
          targetOriginId: "landing_dashboard",
          pathPattern: "/assets/*",
          allowedMethods: ["GET", "HEAD"],
          cachedMethods: ["GET", "HEAD"],
          viewerProtocolPolicy: "redirect-to-https",
          cachePolicyId: cachingOptimizedCachePolicyId,
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: "landing_dashboard",
        allowedMethods: ["GET", "HEAD"],
        cachedMethods: ["GET", "HEAD"],
        viewerProtocolPolicy: "redirect-to-https",
        cachePolicyId: shortCachePolicy.id,
      },
    );

    let dnsRecord = new DNSimple.DNSimpleZoneRecord(
      zoneName: zoneName,
      subDomain: subDomain,
      recordType: "CNAME",
      ttl: 1h.seconds,
      distributionUrl: distribution.domainName,
    );

    return "https://${distribution.domainName}";
  } elif util.env("WING_TARGET") == "sim" {
    return new ReverseProxy.ReverseProxy(
      origins: [
        {
          pathPattern: "/wrpc/*",
          domainName: apiDomainName,
        },
        {
          pathPattern: "*",
          domainName: website.url,
        },
      ],
      port: (): num? => {
        if util.tryEnv("WING_IS_TEST") == "true" {
          return nil;
        } else {
          return 3900;
        }
      }(),
    ).url;
  } else {
    throw "Unknown WING_TARGET: ${util.env("WING_TARGET")}";
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
  probotApp.githubApp.updateWebhookUrl("${webhookUrl}/webhook");
  log("Update your GitHub callback url to: ${proxyUrl}/wrpc/github.callback");
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
new cdktf.TerraformOutput(value: proxyUrl) as "Proxy URL";
