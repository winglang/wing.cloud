bring "../dns/idns.w" as idns;
bring "./iendpoint.w" as iendpoint;
bring "../../status-reports.w" as status;
bring "../../endpoints.w" as endpoints;

pub struct EndpointProps {
  dns: idns.IDNS;
  domain: str;
}

pub class Endpoint impl iendpoint.IEndpoint {
  dns: idns.IDNS;
  domain: str;
  new (props: EndpointProps) {
    this.dns = props.dns;
    this.domain = props.domain;
  }

  pub inflight create(targetUrl: str, endpoint: status.Endpoint): str {
    let publicUrl = "https://${endpoint.digest}.${this.domain}";
    
    this.dns.createRecords([{
      zone: this.domain,
      type: "CNAME",
      name: "${endpoint.digest}",
      content: targetUrl
    }]);

    return publicUrl;
  }

  pub inflight delete(endpoint: endpoints.Endpoint) {
    this.dns.createRecords([{
      zone: this.domain,
      type: "CNAME",
      name: "${endpoint.digest}",
      content: ""
    }]);
  }
}
