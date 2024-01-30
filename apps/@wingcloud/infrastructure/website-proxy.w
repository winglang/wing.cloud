bring cloud;
bring "@cdktf/provider-aws" as awsprovider;
bring "./dnsimple.w" as dnsimple;

pub struct WebsiteProxyOrigin {
  domainName: str;
  pathPattern: str;
  originPath: str?;
}

pub struct WebsiteProxyProps {
  apiOrigin: WebsiteProxyOrigin;
  landingDomainName: str;
  dashboardDomainName: str;
  zoneName: str;
  subDomain: str?;
}

pub class WebsiteProxy {
  pub url: str;

  new(props: WebsiteProxyProps) {
    let certificate = new dnsimple.DNSimpleValidatedCertificate(
      zoneName: props.zoneName,
      subDomain: props.subDomain,
    );

    // See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html#managed-cache-caching-optimized.
    let cachingOptimizedCachePolicyId = "658327ea-f89d-4fab-a63d-7e88639e58f6";

    let passthroughCachePolicy = new awsprovider.cloudfrontCachePolicy.CloudfrontCachePolicy(
      name: "PassthroughCache-{this.node.addr}",
      defaultTtl: 0m.seconds,
      minTtl: 0m.seconds,
      maxTtl: 1s.seconds,
      parametersInCacheKeyAndForwardedToOrigin: {
        cookiesConfig: {
          // Needed to authenticate the API calls.
          cookieBehavior: "all"
        },
        headersConfig: {
          headerBehavior: "none",
        },
        queryStringsConfig: {
          // Needed for many API endpoints.
          queryStringBehavior: "all",
        },
      },
    ) as "passthrough-cache-policy";

    let shortLivedCachePolicy = new awsprovider.cloudfrontCachePolicy.CloudfrontCachePolicy(
      name: "ShortLivedCache-{this.node.addr}",
      defaultTtl: 1m.seconds,
      minTtl: 1m.seconds,
      maxTtl: 10m.seconds,
      parametersInCacheKeyAndForwardedToOrigin: {
        cookiesConfig: {
          cookieBehavior: "none"
        },
        headersConfig: {
          headerBehavior: "none",
        },
        queryStringsConfig: {
          queryStringBehavior: "none",
        },
      },
    ) as "short-cache-policy";

    let removeTrailingSlashes = new awsprovider.cloudfrontFunction.CloudfrontFunction(
      name: "RemoveTrailingSlashes-{this.node.addr.substring(0, 8)}",
      runtime: "cloudfront-js-1.0",
      code: [
        "function handler(event) \{",
        "  var request = event.request;",
        "  var uri = request.uri;",
        "  if (uri != '/' && uri.endsWith('/')) \{",
        "    return \{",
        "      statusCode: 301,",
        "      headers: \{",
        "        location: \{ value: uri.substring(0, uri.length - 1) },",
        "      },",
        "    };",
        "  }",
        "  return request;",
        "}",
      ].join("\n"),
    ) as "RemoveTrailingSlashes";

    let distribution = new awsprovider.cloudfrontDistribution.CloudfrontDistribution(
      enabled: true,
      aliases: ["{props.subDomain}.{props.zoneName}"],
      viewerCertificate: {
        acmCertificateArn: certificate.certificate.certificate.arn,
        sslSupportMethod: "sni-only",
      },
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
        },
      },
      origin: [
        {
          originId: "api",
          domainName: props.apiOrigin.domainName,
          pathPattern: props.apiOrigin.pathPattern,
          originPath: props.apiOrigin.originPath,
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"],
          },
        },
        {
          originId: "landing",
          domainName: props.landingDomainName,
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"],
          },
        },
        {
          originId: "dashboard",
          domainName: props.dashboardDomainName,
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"],
          },
        },
      ],
      originGroup: [
        {
          originId: "landing_dashboard",
          failoverCriteria: {
            statusCodes: [404],
          },
          member: [
            {
              originId: "landing",
            },
            {
              originId: "dashboard",
            },
          ],
        },
      ],
      orderedCacheBehavior: [
        {
          targetOriginId: "api",
          pathPattern: props.apiOrigin.pathPattern,
          allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
          cachedMethods: ["GET", "HEAD", "OPTIONS"],
          viewerProtocolPolicy: "redirect-to-https",
          cachePolicyId: passthroughCachePolicy.id,
        },
        {
          targetOriginId: "landing_dashboard",
          pathPattern: "/assets/*",
          allowedMethods: ["GET", "HEAD"],
          cachedMethods: ["GET", "HEAD"],
          viewerProtocolPolicy: "redirect-to-https",
          cachePolicyId: cachingOptimizedCachePolicyId,
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: "landing_dashboard",
        allowedMethods: ["GET", "HEAD"],
        cachedMethods: ["GET", "HEAD"],
        viewerProtocolPolicy: "redirect-to-https",
        cachePolicyId: shortLivedCachePolicy.id,
        functionAssociation: [
          {
            eventType: "viewer-request",
            functionArn: removeTrailingSlashes.arn,
          },
        ],
      },
    );

    let dnsRecord = new dnsimple.DNSimpleZoneRecord(
      zoneName: props.zoneName,
      subDomain: props.subDomain,
      recordType: "CNAME",
      ttl: 1h.seconds,
      distributionUrl: distribution.domainName,
    );

    this.url = "https://{distribution.domainName}";
  }
}
