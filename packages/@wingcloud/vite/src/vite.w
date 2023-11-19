bring cloud;
bring sim;
bring util;
bring fs;
bring "../node_modules/@wingcloud/simutils/index.w" as simutils;

pub struct ViteProps {
  root: str;
  env: Map<str>?;
}

class SimVite {
	pub url: str;
	new(props: ViteProps) {
		let port = new simutils.Port();
		this.url = "http://localhost:${port.port}";
		let vite = new simutils.Service(
			"pnpm",
			[
				"wingcloud-vite",
				"--port", port.port,
				// "--open",
      ],
			cwd: props.root,
			env: props.env,
			onData: inflight (data: str) => {
				log(data.trim());
			},
		);
	}
}

class TfawsVite {
  pub url: str;
  new(props: ViteProps) {
    simutils.Service.spawnSync(
      "pnpm",
      [
        "wingcloud-vite",
        "build",
      ],
      cwd: props.root,
			env: props.env,
    );

    // TODO: Define cache behaviors for Vite
    // /assets/*       -> cache forever
    // /index.html     -> cache for 1 minute or no cache
    // everything else -> cache for 1 day
    let website = new cloud.Website(
      path: "${props.root}/dist",
    );

    this.url = website.url;
  }
}

pub class Vite {
	pub url: str;
	new(props: ViteProps) {
    let target = util.env("WING_TARGET");
		if target == "sim" {
			let implementation = new SimVite(props);
			this.url = implementation.url;
		} elif target == "tf-aws" {
      let implementation = new TfawsVite(props);
      this.url = implementation.url;
    } else {
      throw "Unknown WING_TARGET ${target}";
    }
	}
}
