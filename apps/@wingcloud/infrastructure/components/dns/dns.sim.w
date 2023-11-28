bring cloud;
bring sim;
bring http;
bring "./idns.w" as idns;

struct SimDNSProxyResult {
  port: num;
  close: inflight (): void;
}

class Util {
  extern "./tcp-proxy.cjs" pub static inflight startServer(): SimDNSProxyResult;
}

pub class DNS impl idns.IDNS {
  url: str;
  new() {
    let state = new sim.State();
    new cloud.Service(inflight () => {
      let result = Util.startServer();
      state.set("url", "http://localhost:{result.port}");
      return () => {
        result.close();
      };
    });
    this.url = state.token("url");
  }

  pub inflight createRecords(records: Array<idns.Record>) {
    let url = this.url;
    for record in records {
      let fromPort = this.portFromUrl(record.name);
      let zone = record.zone;
      let toPort = this.portFromUrl(record.content);
      http.get("{url}?fromPort={fromPort}&host={zone}&toPort={toPort}");
    }
  }

  pub inflight deleteRecords(records: Array<idns.Record>) {
    // the service resource will stop all configured traffic
  }

  inflight portFromUrl(url: str): num {
    return num.fromStr(url.split(":").at(-1));
  }
}
