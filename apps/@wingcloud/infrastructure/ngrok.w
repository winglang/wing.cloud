bring cloud;
bring util;

struct NgrokShellResult {
  pid: num?;
  publicUrl: str;
}

class Ngrok {
  extern "./src/ngrok.mts" static inflight startNgrok(port: str): NgrokShellResult;
  extern "./src/ngrok.mts" static inflight killNgrok(pid: num);

  b: cloud.Bucket;

  init(url: str) {
    this.b = new cloud.Bucket();
    new cloud.Service(inflight () => {
      log("svc1");

      let u = url;
      let parts = u.split(":");
      let port = parts.at(parts.length - 1);

      let result = Ngrok.startNgrok(port);
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
    let var i = 0;
    util.waitUntil(inflight () => {
      return this.b.exists("public_url");
    }, timeout: 10s);
    
    return this.b.get("public_url");
  }
}
