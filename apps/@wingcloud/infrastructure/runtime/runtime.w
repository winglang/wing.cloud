bring cloud;
bring http;
bring ex;
bring util;
bring fs;
bring "constructs" as constructs;
bring "../containers.w" as containers;
bring "../flyio" as flyio;
bring "./runtime-docker.w" as runtimeDocker;
bring "../environments.w" as environments;
bring "@cdktf/provider-aws" as awsprovider;
bring "../components/parameter/iparameter.w" as parameter;
bring "../components/certificate/icertificate.w" as certificate;
bring "../nanoid62.w" as nanoid62;

class Consts {
  pub static inflight secretsPath(): str {
    return "/root/.wing/secrets.json";
  }
}

struct RuntimeStartOptions {
  gitToken: str?;
  gitRepo: str;
  gitSha: str;
  entryfile: str;
  logsBucketName: str;
  logsBucketRegion: str;
  awsAccessKeyId: str;
  awsSecretAccessKey: str;
  wingCloudUrl: parameter.IParameter;
  environmentId: str;
  secrets: Map<str>;
  certificate: certificate.Certificate;
}

struct RuntimeStopOptions {
  environmentId: str;
}

interface IRuntimeHandler {
  inflight start(opts: RuntimeStartOptions): str;
  inflight stop(opts: RuntimeStopOptions);
}

class RuntimeHandler_sim impl IRuntimeHandler {
  container: containers.Container_sim;
  new() {
    this.container = new containers.Container_sim(name: "previews-runtime", image: "../runtime", args: {
      "SETUP_DOCKER": "false",
    },  port: 3000, privileged: true);

    new cloud.Service(inflight () => {
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

    // write wing secrets.json
    let secretsFile = fs.join(fs.mkdtemp("secrets-"), nanoid62.Nanoid62.generate());
    fs.writeFile(secretsFile, Json.stringify(opts.secrets), encoding: "utf8");
    volumes.set(secretsFile, Consts.secretsPath());

    let env = MutMap<str>{
      "GIT_REPO" => repo,
      "GIT_SHA" => opts.gitSha,
      "ENTRYFILE" => opts.entryfile,
      "WING_TARGET" => util.env("WING_TARGET"),
      "LOGS_BUCKET_NAME" => util.env(opts.logsBucketName), // get simulator handle for the bucket
      "WING_CLOUD_URL" => opts.wingCloudUrl.get(),
      "ENVIRONMENT_ID" => opts.environmentId,
      "WING_SIMULATOR_URL" => util.env("WING_SIMULATOR_URL"),
      "SSL_PRIVATE_KEY" => util.base64Encode(opts.certificate.privateKey),
      "SSL_CERTIFICATE" => util.base64Encode(opts.certificate.certificate)
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
    if !exists {
      app.create();
    }

    app.addSecrets({
      "WING_SECRETS": util.base64Encode(Json.stringify(opts.secrets)),
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
      "ENTRYFILE" => opts.entryfile,
      "WING_TARGET" => util.env("WING_TARGET"),
      "WING_CLOUD_URL" => opts.wingCloudUrl.get(),
      "LOGS_BUCKET_NAME" => opts.logsBucketName,
      "ENVIRONMENT_ID" => opts.environmentId,
      "AWS_ACCESS_KEY_ID" => opts.awsAccessKeyId,
      "AWS_SECRET_ACCESS_KEY" => opts.awsSecretAccessKey,
      "AWS_REGION" => opts.logsBucketRegion,
    };

    if let token = opts.gitToken {
      env.set("GIT_TOKEN", token);
    }

    let createOptions: flyio.ICreateMachineProps = {
      imageName: this.image.image.imageName, env: env.copy(), memoryMb: 1024, files: files, services: [{
        protocol: "tcp",
        internal_port: 3000,
        ports: [{
          port: 3000,
          handlers: ["tls"],
        }]
      }, {
        protocol: "tcp",
        internal_port: 3001,
        ports: [{
          port: 443
        }]
      }]
    };
  
    if exists {
      log("updating machine in app ${app.props.name}");
      app.update(createOptions);
    } else {
      log("adding machine to app ${app.props.name}");
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

pub struct Message {
  repo: str;
  sha: str;
  entryfile: str;
  appId: str;
  environmentId: str;
  token: str?;
  secrets: Map<str>;
  certificate: certificate.Certificate;
}

struct RuntimeServiceProps {
  wingCloudUrl: parameter.IParameter;
  flyToken: str?;
  flyOrgSlug: str?;
  environments: environments.Environments;
  logs: cloud.Bucket;
}

bring "@cdktf/provider-aws" as aws;
bring "cdktf" as cdktf;

// Previews environment runtime
pub class RuntimeService {
  logs: cloud.Bucket;
  pub api: cloud.Api;
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
      let awsUser = new aws.iamUser.IamUser(name: "{this.node.addr}-user");
      let bucket: awsprovider.s3Bucket.S3Bucket = unsafeCast(this.logs)?.bucket;
      let bucketArn: str = bucket.arn;
      bucketName = bucket.bucket;
      bucketRegion = bucket.region;
      bucket.forceDestroy = true;
      let awsPolicy = new aws.iamUserPolicy.IamUserPolicy(
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
      let awsAccessKey = new aws.iamAccessKey.IamAccessKey(user: awsUser.name);
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

    let queue = new cloud.Queue(timeout: 15m);
    queue.setConsumer(inflight (message) => {
      try {
        // hack to get bucket in this environment
        this.logs.put;

        let msg = Message.fromJson(Json.parse(message));

        log("wing url: {props.wingCloudUrl}");

        let url = this.runtimeHandler.start(
          gitToken: msg.token,
          gitRepo: msg.repo,
          gitSha: msg.sha,
          entryfile: msg.entryfile,
          wingCloudUrl: props.wingCloudUrl,
          environmentId: msg.environmentId,
          secrets: msg.secrets,
          certificate: msg.certificate,
          logsBucketName: bucketName,
          logsBucketRegion: bucketRegion,
          awsAccessKeyId: awsAccessKeyId,
          awsSecretAccessKey: awsSecretAccessKey,
        );

        log("preview environment url: {url}");

        props.environments.updateUrl(
          id: msg.environmentId,
          appId: msg.appId,
          url: url,
        );
      } catch error {
        log(error);
      }
    }, timeout: 5m);

    this.api = new cloud.Api();
    this.api.post("/", inflight (req) => {
      let body = Json.parse(req.body ?? "");
      let message = Message.fromJson(body);
      queue.push(Json.stringify(message));
      return {
        status: 200,
      };
    });

    this.api.delete("/", inflight (req) => {
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
