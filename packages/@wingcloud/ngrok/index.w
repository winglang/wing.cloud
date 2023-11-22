bring cloud;
bring util;
bring sim;
bring http;
bring "./node_modules/@wingcloud/simutils/index.w" as simutils;

pub struct NgrokProps {
	url: str;
	domain: str?;
}

pub class Ngrok {
	pub url: str;
	new(props: NgrokProps) {
		let args = MutArray<str>[
			"http",
		];
		args.push(props.url);
		if let domain = props.domain {
			args.push("--domain");
			args.push(domain);
		}
		let ngrok = new simutils.Service(
			"ngrok",
			args.copy(),
			onData: inflight (data) => {
				log("[ngrok] ${data}");
			},
		);
		let state = new sim.State();
		this.url = state.token("url");
		let urlRetriever = new cloud.Service(inflight () => {
      let var ngrokAPIPort = 4040;
      while ngrokAPIPort <= 4140 {
        let var retries = 3;
        while retries > 0 {
          let json = Json.parse(http.get("http://localhost:${ngrokAPIPort}/api/tunnels").body);
          for tunnel in Json.values(json.get("tunnels")) {
            let address = tunnel.get("config").get("addr").asStr();
            if address == props.url {
              state.set("url", tunnel.get("public_url").asStr());
            }
            return nil;
          }
          retries -= 1;
          util.sleep(50ms);
        }
        ngrokAPIPort += 1;
      }
			throw "Couldn't find the ngrok tunnel for ${props.url}";
		});
		urlRetriever.node.addDependency(ngrok);
	}
}
