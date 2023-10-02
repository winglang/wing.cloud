bring cloud;
bring http;
bring ex;
bring util;
bring "./runtime/runtime-callbacks.w" as runtime_callbacks;
bring "./runtime/runtime.w" as runtime;
bring "./probot.w" as probot;

// And the sun, and the moon, and the stars, and the flowers.

struct WebsiteFiles {
  cwd: str;
  files: Array<str>;
}

class AstroWebsite  {
  // extern "./src/list-website-files.cjs" static getFiles(): WebsiteFiles;
  extern "./src/website.mts" static inflight handlerAdapter(event: cloud.ApiRequest): cloud.ApiResponse;

  init() {
    let api = new cloud.Api() as "Api";
    // api.get("*", inflight (event) => {
    //   return AstroWebsite.handlerAdapter(event);
    // });
    // api.post("*", inflight (event) => {
    //   return AstroWebsite.handlerAdapter(event);
    // });

    // let bucket = new cloud.Bucket() as "Files";
    // let files = AstroWebsite.getFiles();
    // for file in files.files {
    //   bucket.addFile(file, "${files.cwd}/${file}");
    // }

    let web = new cloud.Website(
      path: "../website/lib/dist/client"
    );
  }
}

// let website = new AstroWebsite();

// bring "@cdktf/provider-aws" as aws;

// struct CdnProps {
//   bucket: cloud.Bucket;
// }
// class Cdn {
//   distribution: aws.cloudfrontDistribution.CloudfrontDistribution;

//   init(props: CdnProps) {
//     this.distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
//       enabled: true,
//       isIpv6Enabled: true,
//       defaultCacheBehavior: {
//         allowedMethods: ["GET", "HEAD", "OPTIONS"],
//         cachedMethods: ["GET", "HEAD", "OPTIONS"],
//         // targetOriginId: "S3-${b.bucket.id}",
//         targetOriginId: "",
//         viewerProtocolPolicy: "redirect-to-https",
//         forwardedValues: {
//           cookies: {
//             forward: "none",
//           },
//           queryString: false,
//         },
//         minTtl: 0,
//         defaultTtl: 86400,
//         maxTtl: 31536000,
//       },
//       origin: [],
//       restrictions: {
//         geoRestriction: {
//           restrictionType: "none",
//         },
//       },
//       viewerCertificate: {
//         cloudfrontDefaultCertificate: true,
//       },
//     );
//   }
// }

// let d = new Cdn(
//   bucket: b,
// );

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

// class Probot {
//   extern "./src/probot.cjs" pub static inflight handler(appId: str, privateKey: str, request: cloud.ApiRequest): void;
// }

// let api = new cloud.Api();

// let probotAppId =  new cloud.Secret(name: "wing.cloud/probot/app_id") as "probotAppId";
// let probotSecretKey = new cloud.Secret(name: "wing.cloud/probot/secret_key") as "probotSecretKey";

// let db = new ex.Table(ex.TableProps{
//   name: "wing.cloud/probot/db",
//   primaryKey: "repositoryId",
//   columns: {
//       repositoryId: ex.ColumnType.STRING,
//       entryPoints: ex.ColumnType.STRING,
//   }
// });

// api.post("/github/webhook", inflight (request: cloud.ApiRequest): cloud.ApiResponse => {
//   let body = Json.tryParse(request.body);
//   let repoId = "${body?.tryGet("repository")?.tryGet("id")}";

//   if repoId == "" {
//       return cloud.ApiResponse {
//           status: 400,
//           body: Json.stringify({ ok: false, error: "Invalid request body" })
//       };
//   }

//   Probot.handler(probotAppId.value(), probotSecretKey.value(), request);
//   return cloud.ApiResponse {
//       status: 200,
//       body: Json.stringify({ ok: true })
//   };

//   return cloud.ApiResponse {
//       status: 200,
//       body: Json.stringify({ ok: true , data: "No project found"})
//   };
// });
