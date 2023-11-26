bring "../dns/idns.w" as idns;
bring "./iendpoint.w" as iendpoint;
bring "../../status-reports.w" as status;
bring "../../endpoints.w" as endpoints;

pub struct EndpointProps {
  dns: idns.IDNS;
}

pub class Endpoint impl iendpoint.IEndpoint {
  dns: idns.IDNS;
  domain: str;
  new (props: EndpointProps) {
    this.dns = props.dns;
    this.domain = "127.0.0.1";
  }

  pub inflight create(targetUrl: str, endpoint: status.Endpoint): str {
    let publicUrl = "http://${this.domain}:${endpoint.port}";
    
    this.dns.createRecords([{
      zone: this.domain,
      type: "CNAME",
      name: "${endpoint.port}",
      content: targetUrl
    }]);

    return publicUrl;
  }

  pub inflight delete(endpoint: endpoints.Endpoint) {

  }
}
