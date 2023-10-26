import * as aws from "@cdktf/provider-aws";

// const bucket = new aws.s3Bucket.S3Bucket();
// bucket.region

let cachePolicy = new aws.cloudfrontCachePolicy.CloudfrontCachePolicy(
  undefined as any,
  "",
  {
    name: "",
    defaultTtl: 0,
    minTtl: 0,
    maxTtl: 0,
    parametersInCacheKeyAndForwardedToOrigin: {
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
      cookiesConfig: {
        cookieBehavior: "all",
        // cookieBehavior: "whitelist",
        // cookies: {
        //   items: ["auth"],
        // },
      },
      headersConfig: {
        headerBehavior: "none",
        // headerBehavior: "whitelist",
        // headers: {
        //   items: [],
        // },
      },
      queryStringsConfig: {
        queryStringBehavior: "all",
        // queryStringBehavior: "whitelist",
        // queryStrings: {
        //   items: [],
        // },
      },
    },
  },
);

const x = new aws.cloudfrontDistribution.CloudfrontDistribution(
  undefined as any,
  "",
  {
    enabled: true,
    isIpv6Enabled: true,
    defaultCacheBehavior: {
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      // targetOriginId: "S3-${b.bucket.id}",
      targetOriginId: "",
      viewerProtocolPolicy: "redirect-to-https",
      cachePolicyId: cachePolicy.id,
      // // forwardedValues: {
      // //   cookies: {
      // //     // forward: "none",
      // //     forward: "",
      // //   },
      // //   queryString: false,
      // // },
      // minTtl: 0,
      // defaultTtl: 86_400,
      // maxTtl: 31_536_000,
    },
    origin: [],
    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },
    viewerCertificate: {
      cloudfrontDefaultCertificate: true,
    },
    orderedCacheBehavior: [
      {
        pathPattern: "/wrpc/*",
        allowedMethods: ["GET", "POST"],
        cachedMethods: [],
        viewerProtocolPolicy: "",
        targetOriginId: "",
        compress: true,
        forwardedValues: {
          queryString: true,
          cookies: { forward: "all" },
          headers: ["cookie"],
        },
        // targetOriginId
      },
    ],
  },
);
