bring cloud;
bring util;
bring "cdktf" as cdktf;
bring "@cdktf/provider-aws" as aws;

pub class CloudfrontLogsBucket {
  pub dependable: cdktf.ITerraformDependable;
  tfBucket: aws.s3Bucket.S3Bucket;

  new(name: str) {
    if util.env("WING_TARGET") == "sim" {
      throw "CloudfrontLogsBucket is not supported in sim";
    }

    let isTestEnvironment = util.tryEnv("WING_IS_TEST") != nil;

    this.tfBucket = new aws.s3Bucket.S3Bucket(
      bucketPrefix: "cloudfront-logs-{name}",
      forceDestroy: isTestEnvironment,
    );

    let publicBlock = new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      bucket: this.tfBucket.bucket,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    );

    let canonicalAwsUserId = new aws.dataAwsCanonicalUserId.DataAwsCanonicalUserId();

    let ownership = new aws.s3BucketOwnershipControls.S3BucketOwnershipControls(
      bucket: this.tfBucket.bucket,
      rule: {
        objectOwnership: "ObjectWriter",
      },
      dependsOn: [publicBlock],
    );

    this.dependable = new aws.s3BucketAcl.S3BucketAcl({
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
      },
      dependsOn: [ownership],
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

  pub name(): str {
    return this.tfBucket.bucket;
  }
}
