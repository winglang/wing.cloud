bring cloud;
bring http;
bring ex;
bring util;
bring fs;
bring sim;
bring "constructs" as constructs;
bring "../containers.w" as containers;
bring "../flyio" as flyio;
bring "./types.w" as types;
bring "./runtime-docker.w" as runtimeDocker;
bring "../environments.w" as environments;
bring "../environment-manager.w" as environmentManager;
bring "@cdktf/provider-aws" as awsprovider;
bring "../components/parameter/iparameter.w" as parameter;
bring "../components/certificate/icertificate.w" as certificate;
bring "../nanoid62.w" as nanoid62;
bring "../components/queues/fifoqueue" as fifoqueue;

class Consts {
  pub static inflight secretsPath(): str {
    return "/app/.env";
  }

  pub static inflight statePath(): str {
    return "/root/.wing/.state";
  }

  pub static inflight cachePath(): str {
    return "/root/.wing/.state/cache";
  }

  pub static inflight volumeName(): str {
    return "state";
  }

  pub static inflight region(): str {
    return "lhr";
  }
}

struct RuntimeStartOptions {
  gitToken: str?;
  gitRepo: str;
  gitSha: str;
  entrypoint: str;
  logsBucketName: str;
  logsBucketRegion: str;
  awsAccessKeyId: str;
  awsSecretAccessKey: str;
  wingCloudUrl: parameter.IParameter;
  environmentId: str;
  secrets: Map<str>;
  certificate: certificate.Certificate;
  privateKey: str;
  publicEndpointFullDomainName: str;
}

struct RuntimeStopOptions {
  environmentId: str;
}

interface IRuntimeHandler {
  inflight start(opts: RuntimeStartOptions): str;
  inflight stop(opts: RuntimeStopOptions): void;
}

class RuntimeHandler_sim impl IRuntimeHandler {
  container: containers.Container_sim;
  stateDir: str;
  new() {
    this.container = new containers.Container_sim(name: "previews-runtime", image: "../runtime", args: {
      "SETUP_DOCKER": "false",
    },  port: 3000, privileged: true);

    let stateVolume = new sim.State();
    this.stateDir = stateVolume.token("volume");

    new cloud.Service(inflight () => {
      stateVolume.set("volume", fs.mkdtemp("state-dir"));
      return () => {
        this.container.stopAll();
      };
    });
  }

  pub inflight start(opts: RuntimeStartOptions): str {
    let var repo = opts.gitRepo;

    let volumes = MutMap<str>{};
    if repo.startsWith("file://") {
      volumes.set(repo.replace("file://", ""), "/source");
      repo = "file:///source";
    }

    // write wing secrets env file
    let secretsFile = fs.join(fs.mkdtemp("secrets-"), nanoid62.Nanoid62.generate());

    let var secretsEnv = "";
    for secret in opts.secrets.entries() {
      secretsEnv += "{secret.key}={secret.value}\n";
    }

    fs.writeFile(secretsFile, secretsEnv, encoding: "utf8");
    volumes.set(secretsFile, Consts.secretsPath());

    // setup the state directory
    let environmentStateDir = fs.join(this.stateDir, opts.environmentId);
    if !fs.exists(environmentStateDir) {
      fs.mkdir(environmentStateDir, recursive: true);
    }
    volumes.set(environmentStateDir, Consts.statePath());

    let env = MutMap<str>{
      "GIT_REPO" => repo,
      "GIT_SHA" => opts.gitSha,
      "ENTRYPOINT" => opts.entrypoint,
      "WING_TARGET" => util.env("WING_TARGET"),
      "LOGS_BUCKET_NAME" => util.env(opts.logsBucketName), // get simulator handle for the bucket
      "WING_CLOUD_URL" => opts.wingCloudUrl.get(),
      "ENVIRONMENT_ID" => opts.environmentId,
      "WING_SIMULATOR_URL" => util.env("WING_SIMULATOR_URL"),
      "SSL_PRIVATE_KEY" => util.base64Encode(opts.certificate.privateKey),
      "SSL_CERTIFICATE" => util.base64Encode(opts.certificate.certificate),
      "ENVIRONMENT_PRIVATE_KEY" => opts.privateKey,
      "CACHE_DIR" => Consts.cachePath(),
      "PUBLIC_ENDPOINT_DOMAIN" => opts.publicEndpointFullDomainName,
    };

    if let token = opts.gitToken {
      env.set("GIT_TOKEN", token);
    }

    if let url = this.container.start(name: opts.environmentId, env: env.copy(), volumes: volumes.copy()) {
      return url;
    } else {
      throw "handleRequest: unable to get container url";
    }
  }

  pub inflight stop(opts: RuntimeStopOptions) {
    this.container.stop(name: opts.environmentId);
  }
}

struct FlyRuntimeHandlerProps {
  flyToken: str;
  flyOrgSlug: str;
}

class RuntimeHandler_flyio impl IRuntimeHandler {
  flyToken: str;
  flyOrgSlug: str;
  image: runtimeDocker.RuntimeDockerImage;
  new(props: FlyRuntimeHandlerProps) {
    this.flyToken = props.flyToken;
    this.flyOrgSlug = props.flyOrgSlug;
    this.image = new runtimeDocker.RuntimeDockerImage(flyOrgSlug: props.flyOrgSlug);
  }

  inflight appNameFromEnvironment(environmentId: str): str {
    return "wing-preview-{util.sha256(environmentId).substring(0, 8)}";
  }

  pub inflight start(opts: RuntimeStartOptions): str {
    let flyClient = new flyio.Client(token: this.flyToken, orgSlug: this.flyOrgSlug);
    let fly = new flyio.Fly(flyClient);
    let app = fly.app(this.appNameFromEnvironment(opts.environmentId));
    let exists = app.exists();
    let mounts = MutArray<flyio.Mount>[];
    if !exists {
      app.create();
      let volume = app.addVolume(name: Consts.volumeName(), region: Consts.region(), size: 1);
      mounts.push({
        name: Consts.volumeName(),
        path: Consts.statePath(),
        volume: volume.id,
      });
    } else {
      let volumes = app.listVolumes();
      mounts.push({
        name: Consts.volumeName(),
        path: Consts.statePath(),
        volume: volumes.at(0).id,
      });
    }

    let var secretsEnv = "";
    for secret in opts.secrets.entries() {
      secretsEnv += "{secret.key}={secret.value}\n";
    }

    app.addSecrets({
      "WING_SECRETS": util.base64Encode(secretsEnv),
      "SSL_PRIVATE_KEY": util.base64Encode(opts.certificate.privateKey),
      "SSL_CERTIFICATE": util.base64Encode(opts.certificate.certificate)
    });

    let files = Array<flyio.File>[{
      guest_path: Consts.secretsPath(),
      secret_name: "WING_SECRETS"
    }];

    let env = MutMap<str>{
      "GIT_REPO" => opts.gitRepo,
      "GIT_SHA" => opts.gitSha,
      "ENTRYPOINT" => opts.entrypoint,
      "WING_TARGET" => util.env("WING_TARGET"),
      "WING_CLOUD_URL" => opts.wingCloudUrl.get(),
      "LOGS_BUCKET_NAME" => opts.logsBucketName,
      "ENVIRONMENT_ID" => opts.environmentId,
      "AWS_ACCESS_KEY_ID" => opts.awsAccessKeyId,
      "AWS_SECRET_ACCESS_KEY" => opts.awsSecretAccessKey,
      "AWS_REGION" => opts.logsBucketRegion,
      "ENVIRONMENT_PRIVATE_KEY" => opts.privateKey,
      "CACHE_DIR" => Consts.cachePath(),
      "PUBLIC_ENDPOINT_DOMAIN" => opts.publicEndpointFullDomainName,
    };

    if let token = opts.gitToken {
      env.set("GIT_TOKEN", token);
    }

    let createOptions: flyio.ICreateMachineProps = {
      region: Consts.region(),
      imageName: this.image.image.imageName,
      env: env.copy(),
      memoryMb: 4096,
      cpu: 2,
      files: files,
      mounts: mounts.copy(),
      services: [{
        protocol: "tcp",
        internal_port: 3000,
        ports: [{
          port: 3000,
          handlers: ["tls"],
        }]
      }, {
        protocol: "tcp",
        internal_port: 30_011,
        ports: [{
          port: 443
        }]
      }]
    };

    if exists {
      log("deleting and creating machine in app {app.props.name}");
      app.update(createOptions);
    } else {
      log("adding machine to app {app.props.name}");
      app.addMachine(createOptions);
    }

    return "{app.url()}:3000";
  }

  pub inflight stop(opts: RuntimeStopOptions) {
    let flyClient = new flyio.Client(token: this.flyToken, orgSlug: this.flyOrgSlug);
    let fly = new flyio.Fly(flyClient);
    let app = fly.app(this.appNameFromEnvironment(opts.environmentId));
    let exists = app.exists();
    if exists {
      app.destroy();
    }
  }
}

struct RuntimeServiceProps {
  api: cloud.Api;
  wingCloudUrl: parameter.IParameter;
  flyToken: str?;
  flyOrgSlug: str?;
  environments: environments.Environments;
  environmentManager: environmentManager.EnvironmentManager;
  logs: cloud.Bucket;
  publicEndpointFullDomainName: str;
}

bring "cdktf" as cdktf;

// Previews environment runtime
pub class RuntimeService {
  logs: cloud.Bucket;
  runtimeHandler: IRuntimeHandler;

  new(props: RuntimeServiceProps) {
    this.logs = props.logs;

    let var bucketName: str = "";
    let var bucketRegion: str = "";
    let var awsAccessKeyId: str = "";
    let var awsSecretAccessKey: str = "";
    if util.tryEnv("WING_TARGET") == "sim" {
      this.runtimeHandler = new RuntimeHandler_sim();
      let bucketAddr = this.logs.node.addr;
      bucketName = "BUCKET_HANDLE_{bucketAddr.substring(bucketAddr.length - 8, bucketAddr.length)}";
    } else {
      let awsUser = new awsprovider.iamUser.IamUser(name: "{this.node.addr}-user");
      let bucket: awsprovider.s3Bucket.S3Bucket = unsafeCast(this.logs)?.bucket;
      let bucketArn: str = bucket.arn;
      bucketName = bucket.bucket;
      bucketRegion = bucket.region;
      bucket.forceDestroy = true;
      let awsPolicy = new awsprovider.iamUserPolicy.IamUserPolicy(
        user: awsUser.name,
        policy: Json.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: ["s3:*"],
              Effect: "Allow",
              Resource: "{bucketArn}/*",
            },
          ],
        }),
      );
      let awsAccessKey = new awsprovider.iamAccessKey.IamAccessKey(user: awsUser.name);
      awsAccessKeyId = awsAccessKey.id;
      awsSecretAccessKey = awsAccessKey.secret;
      if let flyToken = props.flyToken {
        if let flyOrgSlug = props.flyOrgSlug {
          this.runtimeHandler = new RuntimeHandler_flyio(
            flyToken: flyToken,
            flyOrgSlug: flyOrgSlug,
          );
        } else {
          throw "Fly org is missing";
        }
      } else {
        throw "Fly token is missing";
      }
    }

    let queue = new fifoqueue.FifoQueue(timeout: 15m) as "RuntimeFifo-Queue";
    queue.setConsumer(inflight (message) => {
      let var msg: types.Message? = nil;

      try {
        // hack to get bucket in this environment
        this.logs.put;

        msg = types.Message.fromJson(Json.parse(message));
        if let message = msg {
          log("wing url: {props.wingCloudUrl}");

          let url = this.runtimeHandler.start(
            gitToken: message.token,
            gitRepo: message.repo,
            gitSha: message.sha,
            entrypoint: message.entrypoint,
            wingCloudUrl: props.wingCloudUrl,
            environmentId: message.environmentId,
            secrets: message.secrets,
            certificate: message.certificate,
            privateKey: message.privateKey,
            logsBucketName: bucketName,
            logsBucketRegion: bucketRegion,
            awsAccessKeyId: awsAccessKeyId,
            awsSecretAccessKey: awsSecretAccessKey,
            publicEndpointFullDomainName: props.publicEndpointFullDomainName,
          );

          log("preview environment url: {url}");

          props.environments.updateUrl(
            id: message.environmentId,
            appId: message.appId,
            url: url,
          );
        }
      } catch error {
        log(error);
        if let message = msg {
          props.environmentManager.updateStatus(
            statusReport: {
              environmentId: message.environmentId,
              status: "error",
              timestamp: datetime.utcNow().timestampMs,
            }
          );
        }
      }
    }, timeout: 5m);

    props.api.post("/", inflight (req) => {
      let body = Json.parse(req.body ?? "");
      let message = types.Message.fromJson(body);
      queue.push(Json.stringify(message), groupId: message.environmentId);
      return {
        status: 200,
      };
    });

    props.api.delete("/", inflight (req) => {
      let body = Json.parse(req.body ?? "");
      let environmentId = body.get("environmentId").asStr();
      this.runtimeHandler.stop(
        environmentId: environmentId,
      );

      log("preview environment deleted: {environmentId}");

      return {
        status: 200,
      };
    });
  }
}
