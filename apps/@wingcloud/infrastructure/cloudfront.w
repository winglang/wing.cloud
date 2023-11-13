bring cloud;
bring util;
bring "@cdktf/provider-aws" as aws;
bring "./dnsimple.w" as DNSimple;

struct CachePolicyProps {
  name: str;
}

class CachePolicy {
  pub policy: aws.cloudfrontCachePolicy.CloudfrontCachePolicy;

  init(props: CachePolicyProps) {
    this.policy = new aws.cloudfrontCachePolicy.CloudfrontCachePolicy(
      // Since we currently use the same cache policy for website files and API endpoints,
      // we need to get rid of the default cache TTL, otherwise our API endpoints will
      // get cached.
      defaultTtl: 0,
      minTtl: 0,
      maxTtl: 86400,
      name: props.name,
      parametersInCacheKeyAndForwardedToOrigin: {
        // Needed to authenticate the API calls.
        cookiesConfig: {
          cookieBehavior: "all"
        },
        headersConfig: {
          headerBehavior: "none",
        },
        // Needed for many API endpoints.
        queryStringsConfig: {
          queryStringBehavior: "all"
        }
      }
    );
  }
}

pub struct Origin {
  domainName: str;
  originId: str;
  originPath: str?;
  pathPattern: str;
}

struct OriginCustomConfig {
  httpPort: num;
  httpsPort: num;
  originProtocolPolicy: str;
  originSslProtocols: Array<str>;
}

struct HttpOrigin {
  domainName: str;
  originId: str;
  originPath: str?;
  customOriginConfig: OriginCustomConfig;
}

struct CloudFrontDistributionProps {
  validatedCertificate: DNSimple.DNSimpleValidatedCertificate;
  aliases: Array<str>;
  origins: Array<Origin>;
}

pub class CloudFrontDistribution {
  pub distribution: aws.cloudfrontDistribution.CloudfrontDistribution;
  pub logsBucket: cloud.Bucket;

  getDefaultOriginId (origins: Array<Origin>): str {
    for origin in origins {
      if origin.pathPattern == "" {
        return origin.originId;
      }
    }
    return "";
  }

  getHttpOrigins (origins: Array<Origin>): Array<HttpOrigin> {
    let enhancedOrigins = MutArray<HttpOrigin>[];
    for origin in origins {
      let enhancedOrigin = HttpOrigin {
        domainName: origin.domainName,
        originId: origin.originId,
        originPath: origin.originPath,
        customOriginConfig: {
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: "https-only",
          originSslProtocols: ["SSLv3", "TLSv1.2", "TLSv1.1"],
        }
      };
      enhancedOrigins.push(enhancedOrigin);
    }

    return enhancedOrigins.copy();
  }

  getOrderedCacheBehaviorForOrigins (origins: Array<Origin>, cachePolicyId: str): Array<Json> {
    let cacheBehaviors = MutArray<Json>[];
    for origin in origins {
      if origin.pathPattern == "" {
        continue;
      }
      cacheBehaviors.push({
        pathPattern: origin.pathPattern,
        allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: origin.originId,
        viewerProtocolPolicy: "redirect-to-https",
        cachePolicyId: cachePolicyId,
        compress: true,
      });
    }

    return cacheBehaviors.copy();
  }

  init(props: CloudFrontDistributionProps) {
    this.logsBucket = new cloud.Bucket(public: true) as "reverse-proxy-logs-bucket";
    // https://github.com/winglang/wing/issues/4907
    let bucket: aws.s3Bucket.S3Bucket = unsafeCast(this.logsBucket).bucket;

    new aws.s3BucketAcl.S3BucketAcl({
      bucket: bucket.bucket,
      acl: "log-delivery-write"
    });

    let cachePolicy = new CachePolicy(
      name: "cache-policy-for-${this.getDefaultOriginId(props.origins)}"
    );

    this.distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
      enabled: true,
      isIpv6Enabled: true,
      restrictions: {
        geoRestriction: {
          restrictionType: "none"
        }
      },
      defaultRootObject: "index.html",
      customErrorResponse: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: "/index.html",
        },
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: "/index.html",
        },
      ],
      defaultCacheBehavior: {
        allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: this.getDefaultOriginId(props.origins),
        viewerProtocolPolicy: "redirect-to-https",
        cachePolicyId: cachePolicy.policy.id,
        compress: true,
      },
      orderedCacheBehavior: this.getOrderedCacheBehaviorForOrigins(props.origins, cachePolicy.policy.id),
      viewerCertificate: {
        acmCertificateArn: props.validatedCertificate.certificate.certificate.arn,
        sslSupportMethod: "sni-only"
      },
      origin: this.getHttpOrigins(props.origins),
      aliases: props.aliases,
      loggingConfig: {
        bucket: bucket.bucketDomainName,
        includeCookies: true,
        prefix: "reverse-proxy"
      }
    );
  }
}
