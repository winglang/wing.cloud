bring cloud;
bring util;
bring "./proxyapi.types.w" as types;
bring "./proxyapi.aws.w" as awsapi;
bring "./proxyapi.sim.w" as simapi;

pub class ProxyApi impl types.IProxyApi {
  inner: types.IProxyApi;

  new(handler: inflight (types.IProxyApiEvent): types.IProxyApiResponse, props: types.ProxyApiProps) {
    let target = util.env("WING_TARGET");

    if target == "sim" {
      this.inner = new simapi.ProxyApi(handler, props);
    } elif target == "tf-aws" {
      this.inner = new awsapi.ProxyApi(handler, props);
    } else {
      throw "unsupported target {target}";
    }
  }

  pub inflight url(): str {
    return this.inner.url();
  }
}
