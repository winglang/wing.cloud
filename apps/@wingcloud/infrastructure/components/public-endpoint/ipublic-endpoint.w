bring "../dns/idns.w" as idns;
bring "../../status-reports.w" as status;
bring "../../endpoints.w" as endpoints;

pub struct PublicEndpointProps {
  dns: idns.IDNS;
  domain: str;
  subdomain: str?;
}

pub interface IPublicEndpoint {
  inflight create();
  inflight delete();
  inflight url(): str;
}
