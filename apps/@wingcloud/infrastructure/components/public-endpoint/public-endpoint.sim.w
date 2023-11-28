bring "../dns/idns.w" as idns;
bring "./ipublic-endpoint.w" as iendpoint;
bring "../../status-reports.w" as status;
bring "../../endpoints.w" as endpoints;

pub struct EndpointProps {
  dns: idns.IDNS;
  port: num;
  targetUrl: str;
}

pub inflight class PublicEndpoint impl iendpoint.IPublicEndpoint {
  dns: idns.IDNS;
  domain: str;
  port: num;
  targetUrl: str;
  new (props: EndpointProps) {
    this.dns = props.dns;
    this.port = props.port;
    this.targetUrl = props.targetUrl;
    this.domain = "127.0.0.1";
  }

  pub inflight create() {
    this.dns.createRecords([{
      zone: this.domain,
      type: "CNAME",
      name: "${this.port}",
      content: this.targetUrl
    }]);
  }

  pub inflight delete() {

  }

  pub inflight url(): str {
    return "http://${this.domain}:${this.port}";
  }
}
