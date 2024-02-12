bring cloud;
bring sim;
bring util;
bring fs;
bring "@cdktf/provider-aws" as aws;

struct SpawnSyncOptions {
	command: str;
	arguments: Array<str>;
	cwd: str;
	env: Map<str>;
}

struct SpawnOptions {
	command: str;
	arguments: Array<str>;
	cwd: str;
	env: Map<str>;
	// onData: (inflight (str): void)?;
	onData: inflight (str): void;
}

struct SpawnChild {
	kill: inflight (): void;
}

class Util {
	extern "./util.cjs" pub static spawnSync(options: SpawnSyncOptions): void;
	extern "./util.cjs" pub static inflight spawn(options: SpawnOptions): SpawnChild;
	extern "./util.cjs" pub static inflight getURLFromText(text: str): str?;

	pub static readFiles(dir: str, cwd: str?): Array<str> {
		let cwdLength = cwd?.length ?? dir.length;
		let files = fs.readdir(dir);
		let var result = Array<str>[];
		for file in files {
			let path = "{dir}/{file}";
			if (fs.isDir(path)) {
				result = result.concat(Util.readFiles(path, cwd ?? dir));
			} else {
				result = result.concat([path.substring(cwdLength + 1)]);
			}
		}
		return result;
	}
}

pub struct ViteProps {
	root: str;
	env: Map<str>?;
	cacheDuration: duration?;
}

class ViteTfAws {
	pub url: str;
	new(props: ViteProps) {
		Util.spawnSync(
			command: "npx",
			arguments: ["vite", "build"],
			cwd: props.root,
			env: {
				HOME: util.env("HOME"),
				PATH: util.env("PATH"),
				VITE_WING_ENV: "<script>window.wingEnv={Json.stringify(props.env)}</script>",
			},
		);

		// let bucket = new cloud.Bucket();
		let distDir = "{props.root}/dist";
		// let files = Util.readFiles(distDir);
		// for file in files {
		// 	bucket.addFile(
		// 		file,
		// 		"{distDir}/{file}",
		// 	);
		// }

		let website = new cloud.Website(
			path: "{props.root}/dist",
		);

		let bucket = unsafeCast(std.Node.of(website).findChild("WebsiteBucket"));
		new aws.s3Object.S3Object(
			bucket: bucket?.bucket,
			key: "/index.html",
			content: fs.readFile("{distDir}/index.html"),
			contentType: "text/html; charset=utf-8",
		);

		let distribution = unsafeCast(std.Node.of(website).findChild("Distribution"));

		// Fallback to `/index.html`.
		distribution?.addOverride("custom_error_response", [
		  {
			error_code: 403,
			response_code: 200,
			response_page_path: "/index.html",
		  },
		]);

		// Set a short default TTL.
		let cacheDuration = props.cacheDuration ?? 1m;
		distribution?.addOverride("default_cache_behavior.default_ttl", cacheDuration.seconds);
		distribution?.addOverride("default_cache_behavior.min_ttl", cacheDuration.seconds);

		// Cache assets forever.
		distribution?.addOverride("ordered_cache_behavior", {
		  path_pattern: "/assets/*",
		  allowed_methods: ["GET", "HEAD"],
		  cached_methods: ["GET", "HEAD"],
		  target_origin_id: "s3Origin",
		  // See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html#managed-cache-caching-optimized.
		  cache_policy_id: "658327ea-f89d-4fab-a63d-7e88639e58f6",
		  min_ttl: 1y.seconds,
		  default_ttl: 1y.seconds,
		  max_ttl: 1y.seconds,
		  compress: true,
		  viewer_protocol_policy: "redirect-to-https",
		});

		this.url = website.url;
	}
}

class ViteSim {
	pub url: str;
	new(props: ViteProps) {
		let state = new sim.State();
		this.url = state.token("url");

		let HOME = util.env("HOME");
		let PATH = util.env("PATH");
		new cloud.Service(inflight () => {
			let child = Util.spawn(
				command: "npx",
				arguments: ["--yes", "vite"],
				cwd: props.root,
				env: {
					HOME: HOME,
					PATH: PATH,
					VITE_WING_ENV: "<script>window.wingEnv={Json.stringify(props.env)}</script>",
				},
				onData: (data: str) => {
					if state.tryGet("url")? {
						return;
					}

					if let url = Util.getURLFromText(data) {
						state.set("url", url);
					}
				},
			);
			return () => {
				child.kill();
			};
		});

		// The website will be ready when the URL is set.
		new cloud.Service(inflight () => {
		util.waitUntil(() => {
			return state.tryGet("url")?;
		});
		}) as "Wait Until Ready";
	}
}

pub class Vite {
	pub url: str;
	new(props: ViteProps) {
		let target = util.env("WING_TARGET");
		if target == "sim" {
			let website = new ViteSim(props);
			this.url = website.url;
		} elif target == "tf-aws" {
			let website = new ViteTfAws(props);
			this.url = website.url;
		} else {
			throw "Unsupported WING_TARGET {target}";
		}
	}
}
