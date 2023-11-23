// bring cloud;
// bring util;
// bring http;
// bring ex;
// bring "cdktf" as cdktf;

// bring "./reverse-proxy.w" as ReverseProxy;
// bring "./users.w" as Users;
// bring "./apps.w" as Apps;
// bring "./environments.w" as Environments;
// bring "./environment-manager.w" as EnvironmentManager;
// bring "./secrets.w" as Secrets;
// bring "./api.w" as wingcloud_api;

// bring "./runtime/runtime.w" as runtime;
// bring "./runtime/runtime-client.w" as runtime_client;
// bring "./probot.w" as probot;
// bring "./probot-adapter.w" as adapter;
// bring "./cloudfront.w" as cloudFront;
// bring "./components/parameter/parameter.w" as parameter;
// bring "./patches/react-app.patch.w" as reactAppPatch;

// // And the sun, and the moon, and the stars, and the flowers.
// let appSecret = util.env("APP_SECRET");

// let DEFAULT_STAGING_LANDING_DOMAIN = "wing-cloud-staging-dev-only.webflow.io";

// let api = new cloud.Api(
//   cors: true,
//   corsOptions: cloud.ApiCorsOptions {
//     allowOrigin: ["*"],
//   }
// );

// let apiUrlParam = new parameter.Parameter(
//   name: "api-url",
//   value: api.url,
// );

// let table = new ex.DynamodbTable(
//   name: "data",
//   attributeDefinitions: {
//     "pk": "S",
//     "sk": "S",
//   },
//   hashKey: "pk",
//   rangeKey: "sk",
// );
// let apps = new Apps.Apps(table);
// let users = new Users.Users(table);
// let environments = new Environments.Environments(table);
// let secrets = new Secrets.Secrets();

// let probotAdapter = new adapter.ProbotAdapter(
//   probotAppId: util.env("BOT_GITHUB_APP_ID"),
//   probotSecretKey: util.env("BOT_GITHUB_PRIVATE_KEY"),
//   webhookSecret: util.env("BOT_GITHUB_WEBHOOK_SECRET"),
// );

// let bucketLogs = new cloud.Bucket() as "deployment logs";

// let rntm = new runtime.RuntimeService(
//   wingCloudUrl: apiUrlParam,
//   flyToken: util.tryEnv("FLY_TOKEN"),
//   flyOrgSlug: util.tryEnv("FLY_ORG_SLUG"),
//   environments: environments,
//   logs: bucketLogs,
// );

// let websitePort = 5174;
// let website = new ex.ReactApp(
//   projectPath: "../website",
//   startCommand: "pnpm vite --port ${websitePort}",
//   buildCommand: "pnpm vite build",
//   buildDir: "dist",
//   localPort: websitePort,
// );

// reactAppPatch.ReactAppPatch.apply(website);

// let subDomain = util.env("PROXY_SUBDOMAIN");
// let zoneName = util.env("PROXY_ZONE_NAME");

// let var siteDomain = "https://${subDomain}.${zoneName}";
// if util.env("WING_TARGET") == "sim" {
//   siteDomain = "http://localhost:3900";
// }

// let environmentManager = new EnvironmentManager.EnvironmentManager(
//   apps: apps,
//   environments: environments,
//   secrets: secrets,
//   runtimeClient: new runtime_client.RuntimeClient(runtimeUrl: rntm.api.url),
//   probotAdapter: probotAdapter,
//   siteDomain: siteDomain
// );

// let wingCloudApi = new wingcloud_api.Api(
//   api: api,
//   apps: apps,
//   users: users,
//   environments: environments,
//   environmentManager: environmentManager,
//   secrets: secrets,
//   probotAdapter: probotAdapter,
//   githubAppClientId: util.env("BOT_GITHUB_CLIENT_ID"),
//   githubAppClientSecret: util.env("BOT_GITHUB_CLIENT_SECRET"),
//   appSecret: appSecret,
//   logs: bucketLogs,
// );

// let probotApp = new probot.ProbotApp(
//   probotAdapter: probotAdapter,
//   runtimeUrl: rntm.api.url,
//   environments: environments,
//   apps: apps,
//   environmentManager: environmentManager,
//   siteDomain: siteDomain
// );

// let apiDomainName = (() => {
//   if util.env("WING_TARGET") == "tf-aws" {
//     // See https://github.com/winglang/wing/issues/4688.
//     return cdktf.Fn.trimprefix(cdktf.Fn.trimsuffix(api.url, "/prod"), "https://");
//   }
//   return api.url;
// })();

// let proxy = new ReverseProxy.ReverseProxy(
//   subDomain: subDomain,
//   zoneName: zoneName,
//   aliases: ["${subDomain}.${zoneName}"],
//   origins: [
//     {
//       pathPattern: "/wrpc/*",
//       domainName: apiDomainName,
//       originId: "wrpc",
//       originPath: "/prod",
//     },
//     {
//       pathPattern: "*",
//       domainName: util.tryEnv("STAGING_LANDING_DOMAIN") ?? DEFAULT_STAGING_LANDING_DOMAIN,
//       originId: "landingPage",
//     },
//     {
//       pathPattern: "",
//       domainName: website.url.replace("https://", ""),
//       originId: "website",
//     },
//   ],
//   port: (): num? => {
//     if util.tryEnv("WING_IS_TEST") == "true" {
//       return nil;
//     } else {
//       return 3900;
//     }
//   }()
// );

// let var webhookUrl = probotApp.githubApp.webhookUrl;
// if util.tryEnv("WING_TARGET") == "sim" {
//   bring "./node_modules/@wingcloud/ngrok/index.w" as ngrok;

//   let devNgrok = new ngrok.Ngrok(
//     url: webhookUrl,
//     domain: util.tryEnv("NGROK_DOMAIN"),
//   );

//   webhookUrl = devNgrok.url;
// }

// // let updateGithubWebhook = inflight () => {
// //   probotApp.githubApp.updateWebhookUrl("${webhookUrl}/webhook");
// //   log("Update your GitHub callback url to: ${proxy.url}/wrpc/github.callback");
// // };

// // let deploy = new cloud.OnDeploy(updateGithubWebhook);

// // bring "./tests/environments.w" as tests;
// // new tests.EnvironmentsTest(
// //   users: users,
// //   apps: apps,
// //   environments: environments,
// //   githubApp: probotApp.githubApp,
// //   updateGithubWebhook: updateGithubWebhook,
// //   appSecret: appSecret,
// //   wingCloudUrl: apiUrlParam,
// //   githubToken: util.tryEnv("TESTS_GITHUB_TOKEN"),
// //   githubOrg: util.tryEnv("TESTS_GITHUB_ORG"),
// //   githubUser: util.tryEnv("TESTS_GITHUB_USER"),
// // );

// new cdktf.TerraformOutput(value: api.url) as "API URL";
// new cdktf.TerraformOutput(value: website.url) as "Website URL";
// new cdktf.TerraformOutput(value: probotApp.githubApp.webhookUrl) as "Probot API URL";
// new cdktf.TerraformOutput(value: proxy.url) as "Proxy URL";

bring cloud;
bring "@cdktf/provider-aws" as aws;
bring "cdktf" as cdktf;

// let landing = new aws.s3Bucket.S3Bucket() as "LandingBucket";


// let dashboard = new aws.s3Bucket.S3Bucket() as "DashboardBucket";
let landing = new cloud.Website(path: "./landing-website") as "Landing Website";
let dashboard = new cloud.Website(path: "./dashboard-website") as "Dashboard Website";

let getDomainName = (url: str): str => {
  // See https://github.com/winglang/wing/issues/4688.
  return cdktf.Fn.trimprefix(url, "https://");
};

new cdktf.TerraformOutput(value: getDomainName(landing.url)) as "Landing URL";
new cdktf.TerraformOutput(value: getDomainName(dashboard.url)) as "Dashboard URL";

unsafeCast(std.Node.of(dashboard).findChild("Distribution"))?.addOverride("custom_error_response", [
  {
    error_code: 403,
    response_code: 200,
    response_page_path: "/index.html",
  },
]);

new aws.cloudfrontDistribution.CloudfrontDistribution(
  enabled: true,
  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },
  restrictions: {
    geoRestriction: {
      restrictionType: "none",
    },
  },
  origin: [
    {
      originId: "landing",
      domainName: getDomainName(landing.url),
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only",
        originSslProtocols: ["TLSv1.2"],
      },
    },
    {
      originId: "dashboard",
      domainName: getDomainName(dashboard.url),
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
        statusCodes: [403, 404],
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
  // defaultRootObject: "index.html",
  // orderedCacheBehavior: [
  //   {
  //     pathPattern: "/api/*",
  //     cachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
  //     // allowedMethods: ["GET", "HEAD", "OPTIONS"],
  //     // cachedMethods: ["GET", "HEAD", "OPTIONS"],
  //     // targetOriginId: "api",
  //     // viewerProtocolPolicy: "redirect-to-https",
  //     // forwardedValues: {
  //     //   queryString: false,
  //     //   cookies: {
  //     //     forward: "none",
  //     //   },
  //     // },
  //     // minTtl: 0,
  //     // defaultTtl: 0,
  //     // maxTtl: 0,
  //     // compress: true,
  //   },
  //   {
  //     pathPattern: "/dashboard/*",
  //     allowedMethods: ["GET", "HEAD", "OPTIONS"],
  //     cachedMethods: ["GET", "HEAD", "OPTIONS"],
  //     targetOriginId: "dashboard",
  //     viewerProtocolPolicy: "redirect-to-https",
  //     forwardedValues: {
  //       queryString: false,
  //       cookies: {
  //         forward: "none",
  //       },
  //     },
  //     minTtl: 0,
  //     defaultTtl: 1d.seconds,
  //     maxTtl: 1y.seconds,
  //     compress: true,
  //   },
  //   {
  //     pathPattern: "/",
  //     allowedMethods: ["GET", "HEAD", "OPTIONS"],
  //     cachedMethods: ["GET", "HEAD", "OPTIONS"],
  //     targetOriginId: "landing_dashboard",
  //     viewerProtocolPolicy: "redirect-to-https",
  //     forwardedValues: {
  //       queryString: false,
  //       cookies: {
  //         forward: "none",
  //       },
  //     },
  //     minTtl: 0,
  //     defaultTtl: 1d.seconds,
  //     maxTtl: 1y.seconds,
  //     compress: true,
  //   },
  // ],
  defaultCacheBehavior: {
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD", "OPTIONS"],
    targetOriginId: "landing_dashboard",
    viewerProtocolPolicy: "redirect-to-https",
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: "none",
      },
    },
    minTtl: 0,
    defaultTtl: 0,
    maxTtl: 0,
    compress: true,
  },
);
