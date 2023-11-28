bring "../dns/idns.w" as idns;
bring "./ipublic-endpoint.w" as iendpoint;
bring "../../status-reports.w" as status;
bring "../../endpoints.w" as endpoints;

pub struct EndpointProps {
  dns: idns.IDNS;
  domain: str;
  digest: str;
  targetUrl: str;
}

pub inflight class PublicEndpoint impl iendpoint.IPublicEndpoint {
  dns: idns.IDNS;
  domain: str;
  digest: str;
  targetUrl: str;
  new (props: EndpointProps) {
    this.dns = props.dns;
    this.domain = props.domain;
    this.digest = props.digest;
    this.targetUrl = props.targetUrl;
  }

  pub inflight create() {
    this.dns.createRecords([{
      zone: this.domain,
      type: "CNAME",
      name: this.digest,
      content: this.targetUrl.replace("https://", "")
    }]);
  }

  pub inflight delete() {
    this.dns.createRecords([{
      zone: this.domain,
      type: "CNAME",
      name: this.digest,
      content: ""
    }]);
  }

  pub inflight url(): str {
    return "https://${this.digest}.${this.domain}";
  }
}
