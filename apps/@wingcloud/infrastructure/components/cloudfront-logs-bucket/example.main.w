bring cloud;
bring expect;
bring "cdktf" as cdktf;
bring "./bucket.tfaws.w" as logsBucket;
bring "./athena.tfaws.w" as athena;
bring "@cdktf/provider-aws" as aws;

let logPrefix = "testing";
let logBucket = new logsBucket.CloudfrontLogsBucket("my-logs");
new athena.CloudfrontLogsTable(logBucket.name(), logPrefix);

let asset = new cdktf.TerraformAsset(
  path: "./fixtures/E2MPJ4K4OATN7G.2023-11-14-12.e71351af.gz",
  type: cdktf.AssetType.FILE,
);

new aws.s3Object.S3Object(
  bucket: logBucket.name(),
  key: "${logPrefix}/E2MPJ4K4OATN7G.2023-11-14-12.e71351af.gz",
  source: asset.path,
  etag: asset.assetHash,
);

let distBucket = new aws.s3Bucket.S3Bucket(
  bucketPrefix: "website-bucket"
);

let distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
  enabled: true,
  isIpv6Enabled: true,
  restrictions: {
    geoRestriction: {
      restrictionType: "none"
    }
  },
  defaultRootObject: "index.html",
  defaultCacheBehavior: {
    allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
    cachedMethods: ["GET", "HEAD"],
    targetOriginId: "default",
    viewerProtocolPolicy: "redirect-to-https",
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: "none"
      }
    }
  },
  orderedCacheBehavior: [],
  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },
  origin: [{
    domainName: distBucket.bucketDomainName,
    originId: "default"    
  }],
  loggingConfig: {
    bucket: logBucket.domainName(),
    includeCookies: true,
    prefix: logPrefix
  },
  
  // make sure the distribution is deployed after the bucket
  // with all secondary resources, i.e. the ACLs
  dependsOn: [logBucket.dependable]
);

test "logs bucket is deployed" { 
  assert(true);
}