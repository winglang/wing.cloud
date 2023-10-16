bring cloud;
bring util;
bring http;

struct Origin {
  pathPattern: str;
  domainName: str;
}

struct ReverseProxyServerProps{
  origins: Array<Origin>;
}

struct ReverseProxyProps {
  origins: Array<Origin>;
}

class ReverseProxy {
  urlkey: str;
  bucket: cloud.Bucket;
  origins: Array<Origin>;

  extern "./reverse-proxy-local.mts" static inflight startReverseProxyServer(props: ReverseProxyServerProps): num ;

  init(props: ReverseProxyProps) {
    this.urlkey = "url.txt";
    this.bucket = new cloud.Bucket();
    this.origins = props.origins;
    new cloud.Service(inflight () => {
      let port = ReverseProxy.startReverseProxyServer(origins: props.origins);
      this.bucket.put(this.urlkey, "http://localhost:${port}");

      return () => {
        log("stop!");
      };
    });
  }

  pub inflight url(): str {
    util.waitUntil(() => {
      return this.bucket.exists(this.urlkey);
    });
    return this.bucket.get(this.urlkey);
  }

  pub inflight paths(): MutArray<str> {
    // do we have array.map??
    let paths = MutArray<str>[];
    for origin in this.origins {
      paths.push(origin.pathPattern);
    }
    return paths;
  }
}
