bring cloud;

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
    api.get("*", inflight (event) => {
      return AstroWebsite.handlerAdapter(event);
    });
    api.post("*", inflight (event) => {
      return AstroWebsite.handlerAdapter(event);
    });

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

let website = new AstroWebsite();

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
