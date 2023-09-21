bring cloud;
bring http;
bring ex;

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

let wingApi = new cloud.Api() as "wing api";
wingApi.post("/report", inflight () => {
  return {
    status: 200
  };
});

// Previews environment runtime
class Runtime {
  extern "./src/fly.mts" static inflight handler(
    imageName: str,
    repo: str,
    entryfile: str,
    flyToken: str,
    wingApiUrl: str,
    awsAccessKeyId: str,
    awsSecretAccessKey: str
  ): str;

  logs: cloud.Bucket;
  flyToken: cloud.Secret;
  awsAccessKeyId: cloud.Secret;
  awsSecretAccessKey: cloud.Secret;
  init() {
    this.logs = new cloud.Bucket() as "deployment logs";
    this.flyToken = new cloud.Secret(name: "wing.cloud/runtime/flyToken") as "flyToken";
    this.awsAccessKeyId = new cloud.Secret(name: "wing.cloud/runtime/awsAccessKeyId") as "awsAccessKeyId";
    this.awsSecretAccessKey = new cloud.Secret(name: "wing.cloud/runtime/awsSecretAccessKey") as "awsSecretAccessKey";

    // use a function to generate the IAM role with the permissions to write to the bucket
    new cloud.Function(inflight () => {
      // permissions:
      this.logs.put;
    }) as "runtime function";

    // FOR TESTS
    let forTests = new cloud.Api();
    forTests.post("/", inflight (req) => {
      // hack to get bucket name in extern
      this.logs.put;

      let body = Json.parse(req.body ?? "");
      let repo = body.get("repo").asStr();
      let entryfile = body.get("entryfile").asStr();

      // TODO: get bucket name from `this.logs` resource
      let url = Runtime.handler(
        "registry.fly.io/wing-runtime-flyio-test:deployment-01H9ZGZX4Y64EYJ6TCT2Y4YDFV",
        repo,
        entryfile,
        this.flyToken.value(),
        wingApi.url,
        this.awsAccessKeyId.value(),
        this.awsSecretAccessKey.value());
      return {
        status: 200,
        body: Json.stringify({
          url
        })
      };
    });

    test "deploy preview environment" {
      http.post(forTests.url, body: Json.stringify({
        repo: "eladcon/examples",
        entryfile: "examples/redis/main.w"
      }));
    }
  }

}

let runtime = new Runtime();


class Probot {
  extern "./probot.cjs" pub static inflight handler(appId: str, privateKey: str, request: cloud.ApiRequest): void;
}

let api = new cloud.Api();

let probotAppId =  new cloud.Secret(name: "wing.cloud/probot/app_id") as "probotAppId";
let probotSecretKey = new cloud.Secret(name: "wing.cloud/probot/secret_key") as "probotSecretKey";

let db = new ex.Table(ex.TableProps{
  name: "wing.cloud/probot/db",
  primaryKey: "repositoryId",
  columns: {
      repositoryId: ex.ColumnType.STRING,
      entryPoints: ex.ColumnType.STRING,
  }
});

api.post("/github/webhook", inflight (request: cloud.ApiRequest): cloud.ApiResponse => {
  let body = Json.tryParse(request.body);
  let repoId = "${body?.tryGet("repository")?.tryGet("id")}";

  if repoId == "" {
      return cloud.ApiResponse {
          status: 400,
          body: Json.stringify({ ok: false, error: "Invalid request body" })
      };
  }

  Probot.handler(probotAppId.value(), probotSecretKey.value(), request);
  return cloud.ApiResponse {
      status: 200,
      body: Json.stringify({ ok: true })
  };

  return cloud.ApiResponse {
      status: 200,
      body: Json.stringify({ ok: true , data: "No project found"})
  };
});
