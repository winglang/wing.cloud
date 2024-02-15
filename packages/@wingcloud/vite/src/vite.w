bring cloud;
bring sim;
bring util;
bring fs;
bring "cdktf" as cdktf;
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
	onData: inflight (str): void;
}

struct SpawnChild {
	kill: inflight (): void;
}

class Util {
	extern "./util.cjs" pub static contentType(filename: str): str;
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
		// Util.spawnSync(
		// 	command: "npx",
		// 	arguments: ["vite", "build"],
		// 	cwd: props.root,
		// 	env: {
		// 		HOME: util.env("HOME"),
		// 		PATH: util.env("PATH"),
		// 		VITE_WING_ENV: "<script>window.wingEnv={Json.stringify(props.env)}</script>",
		// 	},
		// );

		let distDir = "{props.root}/dist";

		let bucket = new cloud.Bucket();

		let terraformBucket: aws.s3Bucket.S3Bucket = unsafeCast(bucket.node.defaultChild);
		this.listAllFiles(distDir, (file) => {
      let key = "/{file}";
      let filename = fs.absolute("{distDir}/{file}");
      if file == "index.html" {
        bucket.addFile("/{file}", "{distDir}/{file}");
      } else {
        new aws.s3Object.S3Object(
          dependsOn: [terraformBucket],
          key: key,
          bucket: terraformBucket.bucket,
          source: filename,
          sourceHash: cdktf.Fn.md5(filename),
          contentType: Util.contentType(filename),
        ) as "File{key.replace("/", "--")}";
      }
		});

		new aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfiguration(
			bucket: terraformBucket.bucket,
			indexDocument: {
				suffix: "index.html",
			},
			errorDocument: {
				key: "index.html",
			},
		);

		let originAccessControl = new aws.cloudfrontOriginAccessControl.CloudfrontOriginAccessControl(
			name: "{this.node.path}-cloudfront-oac",
			originAccessControlOriginType: "s3",
			signingBehavior: "always",
			signingProtocol: "sigv4",
		);

		let cacheDuration = props.cacheDuration ?? 1m;
		let distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
			enabled: true,
			defaultRootObject: "index.html",
			customErrorResponse: [
				{
					errorCode: 403,
					responseCode: 200,
					responsePagePath: "/index.html",
				},
				{
					errorCode: 404,
					responseCode: 200,
					responsePagePath: "/index.html",
				},
			],
			origin: [
				{
					domainName: terraformBucket.bucketRegionalDomainName,
					originId: "s3Origin",
					originAccessControlId: originAccessControl.id,
				},
			],
			defaultCacheBehavior: {
				allowedMethods: ["GET", "HEAD"],
				cachedMethods: ["GET", "HEAD"],
				targetOriginId: "s3Origin",
				forwardedValues: {
					queryString: false,
					cookies: { forward: "none" },
				},
				viewerProtocolPolicy: "redirect-to-https",
				compress: true,
				minTtl: cacheDuration.seconds,
				defaultTtl: cacheDuration.seconds,
				maxTtl: 1y.seconds,
			},
			priceClass: "PriceClass_100",
			restrictions: {
				geoRestriction: {
				restrictionType: "none",
				},
			},
			viewerCertificate: {
				cloudfrontDefaultCertificate: true,
			},
			orderedCacheBehavior: [
				{
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
				},
			],
		);

		let allowDistributionReadOnly = new aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
			statement: [
				{
					actions: ["s3:GetObject"],
					condition: [
					{
						test: "StringEquals",
						values: [distribution.arn],
						variable: "AWS:SourceArn",
					},
					],
					principals: [
					{
						identifiers: ["cloudfront.amazonaws.com"],
						type: "Service",
					},
					],
					resources: ["{terraformBucket.arn}/*"],
				},
			],
		);

		new aws.s3BucketPolicy.S3BucketPolicy({
			bucket: terraformBucket.id,
			policy: allowDistributionReadOnly.json,
		});

    this.url = "https://{distribution.domainName}";
	}

  listAllFiles(directory: str, handler: (str): void, cwd: str?): void {
    let files = fs.readdir(directory);
    let cwdLength = (cwd ?? directory).length + 1;
    for file in files {
      let path = "{directory}/{file}";
      if (fs.isDir(path)) {
        this.listAllFiles(path, handler, cwd ?? directory);
      } else {
        handler(path.substring(cwdLength));
      }
    }
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
