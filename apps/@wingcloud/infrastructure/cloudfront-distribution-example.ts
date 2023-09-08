import * as aws from "@cdktf/provider-aws";

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
      forwardedValues: {
        cookies: {
          forward: "none",
        },
        queryString: false,
      },
      minTtl: 0,
      defaultTtl: 86_400,
      maxTtl: 31_536_000,
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
    orderedCacheBehavior: [],
  },
);
