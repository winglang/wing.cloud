bring util;
bring "../dns/idns.w" as idns;
bring "./ipublic-endpoint.w" as iendpoint;
bring "./public-endpoint.sim.w" as sim;
bring "./public-endpoint.aws.w" as aws;
bring "../../status-reports.w" as status;
bring "../../endpoints.w" as endpoints;

pub struct PublicEndpointProps {
  dns: idns.IDNS;
  domain: str;
  digest: str;
  port: num;
  targetUrl: str;
  subdomain: str?;
}

pub inflight class PublicEndpoint impl iendpoint.IPublicEndpoint {
  inner: iendpoint.IPublicEndpoint;
  new (props: PublicEndpointProps) {
    if util.env("WING_TARGET") == "sim" {
      this.inner = new sim.PublicEndpoint(dns: props.dns, port: props.port, targetUrl: props.targetUrl);
    } else {
      this.inner = new aws.PublicEndpoint(dns: props.dns, domain: props.domain, digest: props.digest, targetUrl: props.targetUrl, subdomain: props.subdomain);
    }
  }

  pub inflight create() {
    this.inner.create();
  }

  pub inflight delete() {
    this.inner.delete();
  }

  pub inflight url(): str {
    return this.inner.url();
  }
}

pub struct PublicEndpointProviderProps {
  dns: idns.IDNS;
  domain: str;
  subdomain: str?;
}

pub struct NewPublicEndpointOptions {
  digest: str;
  port: num;
  targetUrl: str;
}

pub class PublicEndpointProvider {
  props: PublicEndpointProviderProps;
  new(props: PublicEndpointProviderProps) {
    this.props = props;
  }

  pub inflight from(options: NewPublicEndpointOptions): PublicEndpoint {
    return new PublicEndpoint(
      dns: this.props.dns,
      domain: this.props.domain,
      digest: options.digest,
      port: options.port,
      targetUrl: options.targetUrl,
      subdomain: this.props.subdomain,
    );
  }
}
