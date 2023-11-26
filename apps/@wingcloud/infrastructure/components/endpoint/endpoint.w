bring util;
bring "../dns/idns.w" as idns;
bring "./iendpoint.w" as iendpoint;
bring "./endpoint.sim.w" as sim;
bring "./endpoint.aws.w" as aws;
bring "../../status-reports.w" as status;
bring "../../endpoints.w" as endpoints;

pub struct EndpointProps {
  dns: idns.IDNS;
  domain: str;
}

pub class Endpoint impl iendpoint.IEndpoint {
  inner: iendpoint.IEndpoint;
  new (props: EndpointProps) {
    if util.env("WING_TARGET") == "sim" {
      this.inner = new sim.Endpoint(dns: props.dns);
    } else {
      this.inner = new aws.Endpoint(dns: props.dns, domain: props.domain);
    }
  }

  pub inflight create(targetUrl: str, endpoint: status.Endpoint): str {
    return this.inner.create(targetUrl, endpoint);
  }

  pub inflight delete(endpoint: endpoints.Endpoint) {
    this.inner.delete(endpoint);
  }
}
