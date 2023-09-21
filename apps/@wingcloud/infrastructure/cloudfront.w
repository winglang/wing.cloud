bring cloud;
bring util;
bring "cdktf" as cdktf;
bring "@cdktf/provider-aws" as awsProvider;
bring "dnsimple.w" as DNSimple;

struct CachePolicyProps {
  name: str;
}

class CachePolicy {
  pub policy: awsProvider.cloudfrontCachePolicy.CloudfrontCachePolicy;

  init(props: CachePolicyProps) {
    this.policy = new awsProvider.cloudfrontCachePolicy.CloudfrontCachePolicy(
      defaultTtl: 60,
      maxTtl: 86400,
      minTtl: 0,
      name: props.name,
      parametersInCacheKeyAndForwardedToOrigin: {
        cookiesConfig: {
          cookieBehavior: "all"
        },
        headersConfig: {
          headerBehavior: "whitelist",
          headers: {
            items: ["Accept-Datetime", "Accept-Encoding", "Accept-Language", "User-Agent", "Referer", "Origin", "X-Forwarded-Host"]
          }
        },
        queryStringsConfig: {
          queryStringBehavior: "all"
        }
      }
    );
  }
}

struct Origin {
  domainName: str;
  originId: str;
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
  customOriginConfig: OriginCustomConfig;
}

struct CloudFrontDistributionProps {
  validatedCertificate: DNSimple.DNSimpleValidatedCertificate;
  aliases: Array<str>;
  origins: Array<Origin>;
}

class CloudFrontDistribution {
  pub distribution: awsProvider.cloudfrontDistribution.CloudfrontDistribution;

  getDefaultOriginId (origins: Array<Origin>): str {
    for origin in origins {
      if origin.pathPattern == "" {
        return origin.originId;
      }
    }
    return "";
  }

  getHttpOrigins (origins: Array<Origin>): MutArray<HttpOrigin> {
    let enhancedOrigins = MutArray<HttpOrigin>[];
    for origin in origins {
      let enhancedOrigin = {
        domainName: origin.domainName,
        originId: origin.originId,
        customOriginConfig: {
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: "https-only",
          originSslProtocols: ["SSLv3", "TLSv1.2", "TLSv1.1"]
        }
      };
      enhancedOrigins.push(enhancedOrigin);
    }

    return enhancedOrigins;
  }

  getOrderedCacheBehaviorForOrigins (origins: Array<Origin>, cachePolicyId: str): MutArray<Json> {
    let cacheBehaviors = MutArray<Json>[];
    for origin in origins {
      if origin.pathPattern == "" {
        continue;
      }
      cacheBehaviors.push(
        {
          pathPattern: origin.pathPattern,
          allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
          cachedMethods: ["GET", "HEAD"],
          targetOriginId: origin.originId,
          viewerProtocolPolicy: "redirect-to-https",
          cachePolicyId: cachePolicyId
        }
      );
    }

    return cacheBehaviors;
  }

  init(props: CloudFrontDistributionProps) {

    let cachePolicy = new CachePolicy(name: "cache-policy-for-${this.getDefaultOriginId(props.origins)}");

    this.distribution = new awsProvider.cloudfrontDistribution.CloudfrontDistribution(
      enabled: true,
      isIpv6Enabled: true,
      restrictions: {
        geoRestriction: {
          restrictionType: "none"
        }
      },
      defaultCacheBehavior: {
        allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: this.getDefaultOriginId(props.origins),
        viewerProtocolPolicy: "redirect-to-https",
        cachePolicyId: cachePolicy.policy.id
      },
      orderedCacheBehavior: this.getOrderedCacheBehaviorForOrigins(props.origins, cachePolicy.policy.id),
      viewerCertificate: {
        acmCertificateArn: props.validatedCertificate.certificate.certificate.arn,
        sslSupportMethod: "sni-only"
      },
      origin: this.getHttpOrigins(props.origins),
      aliases: props.aliases
    );
  }
}
