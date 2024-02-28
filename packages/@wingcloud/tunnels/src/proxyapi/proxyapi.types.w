pub struct ProxyApiProps {
  zoneName: str;
  subDomain: str;
}

pub interface IProxyApi {
  inflight url(): str;
}

pub struct IProxyApiEvent {
  subdomain: str;
  body: str?;
  headers: Map<str>?;
  httpMethod: str;
  isBase64Encoded: bool;
  path: str;
  queryStringParameters: Map<str>?;
}

pub struct IProxyApiResponse {
  statusCode: num;
  body: str?;
  headers: Map<str>?;
}

pub struct IProxyApiAwsRequestContext {
  domainName: str;
}

pub struct IProxyApiAwsRequest {
  requestContext: IProxyApiAwsRequestContext;
  path: str;
  httpMethod: str;
  body: str?;
  headers: Map<str>?;
  isBase64Encoded: bool;
  queryStringParameters: Map<str>?;
}
