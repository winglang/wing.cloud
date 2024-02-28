bring cloud;
bring util;
bring "./proxyapi.types.w" as types;

interface StartServerResult {
  inflight port(): num;
  inflight close(): void;
}

pub class ProxyApi impl types.IProxyApi {
  bucket: cloud.Bucket;
  new(handler: inflight (types.IProxyApiEvent): types.IProxyApiResponse, props: types.ProxyApiProps) {
    this.bucket = new cloud.Bucket();
    new cloud.Service(inflight () => {
      let res = ProxyApi.startServer(handler);
      this.bucket.put("url.txt", "http://localhost:{res.port()}");
      return () => {
        res.close();
      };
    });
  }

  pub inflight url(): str {
    util.waitUntil(inflight () => {
      return this.bucket.exists("url.txt");
    });
    return this.bucket.get("url.txt");
  }

  extern "./start-local-server.mts" static inflight startServer(handler: inflight (types.IProxyApiEvent): types.IProxyApiResponse): StartServerResult;
}