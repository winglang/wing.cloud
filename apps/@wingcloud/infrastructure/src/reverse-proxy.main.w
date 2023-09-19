bring cloud;
bring "cdktf" as cdktf;
bring "@cdktf/provider-aws" as awsProvider;
bring "@cdktf/provider-dnsimple" as dnsimpleProvider;

let DNSIMPLE_TOKEN = new cdktf.TerraformVariable({
  type: "string",
}) as "DNSIMPLE_TOKEN";
let DNSIMPLE_ACCOUNT = new cdktf.TerraformVariable({
  type: "string",
}) as "DNSIMPLE_ACCOUNT";

new dnsimpleProvider.provider.DnsimpleProvider({
  token: "${DNSIMPLE_TOKEN}",
  account: "${DNSIMPLE_ACCOUNT}"
});

struct DNSRecordProps {
  zoneName: str;
  subDomain: str;
  recordType: str;
  ttl: num;
  distributionUrl: str;
}

class DNSimpleZoneRecord {
  record: dnsimpleProvider.zoneRecord.ZoneRecord;

  init(props: DNSRecordProps) {
    this.record = new dnsimpleProvider.zoneRecord.ZoneRecord(
      zoneName: props.zoneName,
      name: props.subDomain, // For the root domain, use an empty string. For subdomains, use the subdomain part (like 'www' for 'www.yourdomain.com')
      value: props.distributionUrl, // This a CloudFront URL. CloudFront distribution domain or any other target.
      type: props.recordType,
      ttl: props.ttl
    );
  }
}

struct CertificateProps {
  domainName: str;
}

class Certificate {
  certificate: awsProvider.acmCertificate.AcmCertificate;

  init(props: CertificateProps) {
    this.certificate = new awsProvider.acmCertificate.AcmCertificate(
      domainName: props.domainName,
      validationMethod: "DNS",
      lifecycle: {
       createBeforeDestroy: true,
      }
    );
  }
}

struct DNSimpleValidateCertificateProps {
  zoneName: str;
  subDomain: str;
}

// this class introduces some strange workarounds for validating a certificate
// see https://github.com/hashicorp/terraform-cdk/issues/2178
class DNSimpleValidatedCertificate {
  certificate: Certificate;

  init(props: DNSimpleValidateCertificateProps) {
    this.certificate = new Certificate(domainName: "${props.subDomain}.${props.zoneName}");
    let dnsRecord = new DNSimpleZoneRecord(
      subDomain: "replaced",
      recordType: "\${each.value.type}",
      distributionUrl: "replaced",
      ttl: 60,
      zoneName: props.zoneName
    ) as "${props.zoneName}.dnsimple.zoneRecord.ZoneRecord";

    dnsRecord.record.addOverride("name", "\${replace(each.value.name, \".${props.zoneName}.\", \"\")}");
    dnsRecord.record.addOverride("value", "\${replace(each.value.record, \"acm-validations.aws.\", \"acm-validations.aws\")}");
    dnsRecord.record.addOverride("for_each", "\${{
        for dvo in ${this.certificate.certificate.fqn}.domain_validation_options : dvo.domain_name => {
          name   = dvo.resource_record_name
          record = dvo.resource_record_value
          type   = dvo.resource_record_type
        }
      }
    }");

    let certValidation = new awsProvider.acmCertificateValidation.AcmCertificateValidation(
      certificateArn: this.certificate.certificate.arn
    )as "${props.zoneName}.aws.acmCertificateValidation.AcmCertificateValidation";

    certValidation.addOverride("validation_record_fqdns", "\${[for record in ${dnsRecord.record.fqn} : record.qualified_name]}");
  }
}

struct CachePolicyProps {
  name: str;
}

class CachePolicy {
  policy: awsProvider.cloudfrontCachePolicy.CloudfrontCachePolicy;

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
  isDefault: bool;
}

struct OriginCustomConfig {
  httpPort: num;
  httpsPort: num;
  originProtocolPolicy: str;
  originSslProtocols: Array<str>;
}

// extends Origin?
struct HttpOrigin {
  domainName: str;
  originId: str;
  customOriginConfig: OriginCustomConfig;
}

struct CloudFrontDistributionProps {
  validatedCertificate: DNSimpleValidatedCertificate;
  aliases: Array<str>;
  origins: Array<Origin>;
}

class CloudFrontDistribution {
  distribution: awsProvider.cloudfrontDistribution.CloudfrontDistribution;

  getDefaultOriginId (origins: Array<Origin>): str {
    for origin in origins {
      if origin.isDefault {
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
      if origin.isDefault {
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
        acmCertificateArn: props.validatedCertificte.certificate.certificate.arn,
        sslSupportMethod: "sni-only"
      },
      origin: this.getHttpOrigins(props.origins),
      aliases: props.aliases
    );
  }
}

struct ReverseProxyProps {
  zoneName: str;
  subDomain: str;
  aliases: Array<str>;
  origins: Array<Origin>;
}

class ReverseProxy {

  init(props: ReverseProxyProps) {
    //validated certificate
    let validatedCertificate = new DNSimpleValidatedCertificate(
      zoneName: props.zoneName,
      subDomain: props.subDomain
    );
    //create distribution
    let cloudFrontDist = new CloudFrontDistribution(
      validatedCertificate: validatedCertificate,
      aliases: props.aliases,
      origins: props.origins
    );
    //create dnsimple record
    let dnsRecord = new DNSimpleZoneRecord(
      zoneName: props.zoneName,
      subDomain: props.subDomain,
      recordType: "CNAME",
      ttl: 60,
      distributionUrl: cloudFrontDist.destribution.domainName
    );
  }
}

////////   test    ////////

let zoneName = "wingcloud.io";
let subDomain = "dev";

let origins = Array<Origin>[
  {
    domainName: "site-demo-eta.vercel.app",
    originId: "site-demo-eta",
    pathPattern: "",
    isDefault: true
  },
  {
    domainName: "site-api.vercel.app",
    originId: "api.demo.site",
    pathPattern: "/api",
    isDefault: false
  },
  {
    domainName: "site-dashboard-phi.vercel.app",
    originId: "dashboard.demo.site",
    pathPattern: "/dashboard",
    isDefault: false
  }
];


let reverseProxy = new ReverseProxy(
  origins: origins,
  subDomain: subDomain,
  zoneName: zoneName,
  aliases: [ "${subDomain}.${zoneName}"],
);

