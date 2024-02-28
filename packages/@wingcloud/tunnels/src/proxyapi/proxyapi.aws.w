bring cloud;
bring aws;
bring "@cdktf/provider-aws" as awsProvider;
bring "cdktf" as cdktf;
bring "./proxyapi.types.w" as types;
bring "./dnsimple.w" as dnsimple;

pub class ProxyApi impl types.IProxyApi {
  api: awsProvider.apiGatewayRestApi.ApiGatewayRestApi;
  apiEndpoint: str;
  new(handler: inflight (types.IProxyApiEvent): types.IProxyApiResponse, props: types.ProxyApiProps) {
    let fn = new cloud.Function(unsafeCast(inflight (event: types.IProxyApiAwsRequest): types.IProxyApiResponse => {
      let host = event.headers?.tryGet("Host");
      if host == nil {
        return {
          statusCode: 404,
          body: "Missing subdomain"
        };
      }

      let parts = host?.split(".");
      if parts == nil {
        return {
          statusCode: 404,
          body: "Missing subdomain"
        };
      }

      let subdomain = parts?.tryAt(0);
      if subdomain == nil {
        return {
          statusCode: 404,
          body: "Missing subdomain"
        };
      }

      let handlerEvent = types.IProxyApiEvent{
        subdomain: subdomain ?? "should-not-happen",
        body: event.body,
        headers: event.headers,
        httpMethod: event.httpMethod,
        path: event.path,
        queryStringParameters: event.queryStringParameters,
        isBase64Encoded: false
      };
      let res = handler(handlerEvent);
      return res;
    }));

    let unsafeHandler = unsafeCast(fn);
    let handlerArn: str = unsafeHandler?.arn;
    let handlerInvokeArn: str = unsafeHandler?.invokeArn;
    let handlerName: str = unsafeHandler?.functionName;

    this.api = new awsProvider.apiGatewayRestApi.ApiGatewayRestApi(
      name: "wing-anyproxy-tunnels-{props.zoneName}",
      endpointConfiguration: {
        types: ["EDGE"]
      }
    );

    let proxy = new awsProvider.apiGatewayResource.ApiGatewayResource(
      restApiId: this.api.id,
      parentId: this.api.rootResourceId,
      pathPart: "\{proxy+}"
    ) as "proxy resource";

    let proxyMethod = new awsProvider.apiGatewayMethod.ApiGatewayMethod(
      restApiId: this.api.id,
      resourceId: proxy.id,
      authorization: "NONE",
      httpMethod: "ANY"
    ) as "proxy method";

    let proxyIntegration = new awsProvider.apiGatewayIntegration.ApiGatewayIntegration(
      httpMethod: proxyMethod.httpMethod,
      resourceId: proxy.id,
      restApiId: this.api.id,
      type: "AWS_PROXY",
      integrationHttpMethod: "POST",
      uri: handlerInvokeArn
    ) as "proxy integration";

    let rootMethod = new awsProvider.apiGatewayMethod.ApiGatewayMethod(
      restApiId: this.api.id,
      resourceId: this.api.rootResourceId,
      authorization: "NONE",
      httpMethod: "ANY"
    ) as "root method";

    let rootIntegration = new awsProvider.apiGatewayIntegration.ApiGatewayIntegration(
      httpMethod: rootMethod.httpMethod,
      resourceId: rootMethod.resourceId,
      restApiId: this.api.id,
      type: "AWS_PROXY",
      integrationHttpMethod: "POST",
      uri: handlerInvokeArn
    ) as "root integration";

    let deploy = new awsProvider.apiGatewayDeployment.ApiGatewayDeployment(
      restApiId: this.api.id,
      dependsOn: [proxyIntegration, rootIntegration],
      stageName: "prod",
    );

    new awsProvider.lambdaPermission.LambdaPermission(
      action: "lambda:InvokeFunction",
      functionName: handlerName,
      principal: "apigateway.amazonaws.com",
      sourceArn: "{this.api.executionArn}/*/*"
    );

    //// CLOUDFRONT

    let zoneName = props.zoneName;
    let subDomain = "*.{props.subDomain}";

    //validated certificate
    let validatedCertificate = new dnsimple.DNSimpleValidatedCertificate(
      zoneName: zoneName,
      subDomain: subDomain
    );

    let apiDomainName = new awsProvider.apiGatewayDomainName.ApiGatewayDomainName(
      domainName: "{subDomain}.{zoneName}",
      certificateArn: validatedCertificate.certificate.certificate.arn,
      dependsOn: [validatedCertificate.certValidation]
    );

    new awsProvider.apiGatewayBasePathMapping.ApiGatewayBasePathMapping(
      apiId: this.api.id,
      stageName: deploy.stageName,
      domainName: apiDomainName.domainName
    );

    let dnsRecord = new dnsimple.DNSimpleZoneRecord(
      zoneName: zoneName,
      subDomain: subDomain,
      recordType: "CNAME",
      ttl: 60,
      distributionUrl: apiDomainName.cloudfrontDomainName //cf.domainName
    );

    this.apiEndpoint = "{props.subDomain}.{props.zoneName}";
  }

  pub inflight url(): str {
    return this.apiEndpoint;
  }
}
