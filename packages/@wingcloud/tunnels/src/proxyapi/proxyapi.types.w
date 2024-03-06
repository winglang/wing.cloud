pub struct ProxyApiProps {
  zoneName: str;
  subDomain: str;
}

pub interface IProxyApi {
  inflight url(): str;
}

pub struct ProxyApiEvent {
  subdomain: str;
  body: str?;
  headers: Map<str>?;
  httpMethod: str;
  isBase64Encoded: bool;
  path: str;
  queryStringParameters: Map<str>?;
}

pub struct ProxyApiResponse {
  statusCode: num;
  body: str?;
  headers: Map<str>?;
}

pub struct ProxyApiAwsRequestContext {
  domainName: str;
}

pub struct ProxyApiAwsRequest {
  requestContext: ProxyApiAwsRequestContext;
  path: str;
  httpMethod: str;
  body: str?;
  headers: Map<str>?;
  isBase64Encoded: bool;
  queryStringParameters: Map<str>?;
}
