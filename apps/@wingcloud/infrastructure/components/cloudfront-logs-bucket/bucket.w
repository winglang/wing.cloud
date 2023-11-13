bring cloud;
bring util;
bring "@cdktf/provider-aws" as aws;

pub class CloudfrontLogsBucket {
  tfBucket: aws.s3Bucket.S3Bucket;

  init(name: str) {
    if util.env("WING_TARGET") == "sim" {
      throw "CloudfrontLogsBucket is not supported in sim";
    }

    this.tfBucket = new aws.s3Bucket.S3Bucket(
      bucketPrefix: "cloudfront-logs-${name}",
    );

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      bucket: this.tfBucket.bucket,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    );

    let canonicalAwsUserId = new aws.dataAwsCanonicalUserId.DataAwsCanonicalUserId();

    new aws.s3BucketAcl.S3BucketAcl({
      bucket: this.tfBucket.bucket,
      accessControlPolicy: {
        owner: {
          id: canonicalAwsUserId.id,
        },
        grant: [{
          grantee: {
            id: canonicalAwsUserId.id,
            type: "CanonicalUser",
          },
          permission: "FULL_CONTROL",
        },
        {
          grantee: {
            // Grant CloudFront logs access to your Amazon S3 Bucket
            // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html#AccessLogsBucketAndFileOwnership
            id: "c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0",
            type: "CanonicalUser",
          },
          permission: "FULL_CONTROL",
        }
        ]
      }
    });

    new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      bucket: this.tfBucket.bucket,
      rule: [{
        id: "exipration",
        status: "Enabled",
        expiration: {
          days: 365,
        },
      }],      
    );
  }

  pub domainName(): str {
    return this.tfBucket.bucketDomainName;
  }
}