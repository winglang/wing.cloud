bring cloud;
bring util;

struct NgrokShellResult {
  pid: num?;
  publicUrl: str;
}

struct NgrokProps {
  url: inflight (): str;
  domain: str?;
}

class Ngrok {
  extern "./src/ngrok.mts" static inflight startNgrok(port: str, domain: str?): NgrokShellResult;
  extern "./src/ngrok.mts" static inflight killNgrok(pid: num);

  b: cloud.Bucket;

  init(props: NgrokProps) {
    this.b = new cloud.Bucket();
    new cloud.Service(inflight () => {
      let url = props.url();
      let parts = url.split(":");
      let port = parts.at(parts.length - 1);

      let result = Ngrok.startNgrok(port, props.domain);
      if let pid = result.pid {
        this.b.put("pid", "${pid}");
        this.b.put("public_url", result.publicUrl);
      }

      return () => {
        if let pid = this.b.tryGet("pid") {
          Ngrok.killNgrok(num.fromStr(pid));
        }
      };
    });
  }

  pub inflight waitForUrl(): str {
    util.waitUntil(inflight () => {
      return this.b.exists("public_url");
    }, timeout: 10s);

    return this.b.get("public_url");
  }
}
