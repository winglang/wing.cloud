bring "../dns/idns.w" as idns;
bring "../../status-reports.w" as status;
bring "../../endpoints.w" as endpoints;

pub struct EndpointProps {
  dns: idns.IDNS;
  domain: str;
}

pub interface IEndpoint {
  inflight create(targetUrl: str, endpoint: status.Endpoint): str;
  inflight delete(endpoint: endpoints.Endpoint);
}
