bring http;
bring "../dns/idns.w" as idns;
bring "./ipublic-endpoint.w" as iendpoint;
bring "../../status-reports.w" as status;
bring "../../endpoints.w" as endpoints;

pub struct EndpointProps {
  dns: idns.IDNS;
  domain: str;
  digest: str;
  targetUrl: str;
  subdomain: str?;
}

pub inflight class PublicEndpoint impl iendpoint.IPublicEndpoint {
  dns: idns.IDNS;
  domain: str;
  digest: str;
  targetUrl: str;
  subdomain: str?;
  new (props: EndpointProps) {
    this.dns = props.dns;
    this.domain = props.domain;
    this.digest = props.digest;
    this.targetUrl = props.targetUrl;
    this.subdomain = props.subdomain;
  }

  pub inflight create() {
    let url = http.parseUrl(this.targetUrl);
    this.dns.createRecords([{
      zone: this.domain,
      type: "CNAME",
      name: this.name(),
      content: url.hostname
    }]);
  }

  pub inflight delete() {
    this.dns.deleteRecords([{
      zone: this.domain,
      type: "CNAME",
      name: this.name(),
      content: ""
    }]);
  }

  pub inflight url(): str {
    return "https://{this.name()}.{this.domain}";
  }

  inflight name(): str {
    if let subdomain = this.subdomain {
      return "{this.digest}.{subdomain}";
    } else {
      return this.digest;
    }
  }
}
