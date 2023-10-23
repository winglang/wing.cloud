bring cloud;
bring util;
bring sim;

struct NgrokShellResult {
  pid: num?;
  publicUrl: str;
}

struct NgrokProps {
  url: str;
  domain: str?;
}

pub class Ngrok {
  extern "./src/ngrok.mts" static inflight startNgrok(port: str, domain: str?): NgrokShellResult;
  extern "./src/ngrok.mts" static inflight killNgrok(pid: num);

  pub url: str;

  init(props: NgrokProps) {
    let state = new sim.State();
    this.url = state.token("url");
    new cloud.Service(inflight () => {
      let url = props.url;
      let parts = url.split(":");
      let port = parts.at(parts.length - 1);

      let result = Ngrok.startNgrok(port, props.domain);
      if let pid = result.pid {
        state.set("pid", "${pid}");
        state.set("url", result.publicUrl);
        log("ngrok url = ${result.publicUrl}");
      }

      return () => {
        if let pid = state.tryGet("pid")?.tryAsStr() {
          Ngrok.killNgrok(num.fromStr(pid));
        }
      };
    });
  }
}
