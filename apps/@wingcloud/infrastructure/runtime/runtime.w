bring cloud;
bring http;
bring ex;
bring util;
bring "constructs" as constructs;
bring "../containers.w" as containers;
bring "../flyio" as flyio;
bring "./runtime-docker.w" as runtimeDocker;

struct RuntimeStartOptions {
  gitToken: str?;
  gitRepo: str;
  gitSha: str;
  entryfile: str;
  logsBucketName: str;
  logsBucketRegion: str;
  awsAccessKeyId: str;
  awsSecretAccessKey: str;
  wingCloudUrl: str;
  environmentId: str;
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
  init() {
    this.container = new containers.Container_sim(name: "previews-runtime", image: "../runtime", args: {
      "SETUP_DOCKER": "false",
    },  port: 3000, privileged: true);

    new cloud.Service(inflight () => {
      return () => {
        this.container.stop();
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

    let env = MutMap<str>{
      "GIT_REPO" => repo,
      "GIT_SHA" => opts.gitSha,
      "ENTRYFILE" => opts.entryfile,
      "WING_TARGET" => util.env("WING_TARGET"),
      "LOGS_BUCKET_NAME" => "stam", // opts.logsBucketName,
      "WING_CLOUD_URL" => opts.wingCloudUrl,
      "ENVIRONMENT_ID" => opts.environmentId,
    };

    if let token = opts.gitToken {
      env.set("GIT_TOKEN", token);
    }

    this.container.start(env: env.copy(), volumes: volumes.copy());

    if let url = this.container.url() {
      return url;
    } else {
      throw "handleRequest: unable to get container url";
    }
  }

  pub inflight stop(opts: RuntimeStopOptions) {
    this.container.stop();
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
  init(props: FlyRuntimeHandlerProps) {
    this.flyToken = props.flyToken;
    this.flyOrgSlug = props.flyOrgSlug;
    this.image = new runtimeDocker.RuntimeDockerImage();
  }

  pub inflight start(opts: RuntimeStartOptions): str {
    let flyClient = new flyio.Client(token: this.flyToken, orgSlug: this.flyOrgSlug);
    let fly = new flyio.Fly(flyClient);
    let app = fly.app("wing-preview-${util.sha256(opts.environmentId)}");
    let exists = app.exists();
    if !exists {
      app.create();
    }

    let env = MutMap<str>{
      "GIT_REPO" => opts.gitRepo,
      "GIT_SHA" => opts.gitSha,
      "ENTRYFILE" => opts.entryfile,
      "WING_TARGET" => util.env("WING_TARGET"),
      "WING_CLOUD_URL" => opts.wingCloudUrl,
      "LOGS_BUCKET_NAME" => opts.logsBucketName,
      "ENVIRONMENT_ID" => opts.environmentId,
      "AWS_ACCESS_KEY_ID" => opts.awsAccessKeyId,
      "AWS_SECRET_ACCESS_KEY" => opts.awsSecretAccessKey,
      "AWS_REGION" => opts.logsBucketRegion,
    };

    if let token = opts.gitToken {
      env.set("GIT_TOKEN", token);
    }

    if exists {
      app.update(imageName: this.image.image.imageName, env: env.copy(), port: 3000, memoryMb: 1024);
    } else {
      app.addMachine(imageName: this.image.image.imageName, env: env.copy(), port: 3000, memoryMb: 1024);
    }

    return app.url();
  }

  pub inflight stop(opts: RuntimeStopOptions) {
    let flyClient = new flyio.Client(this.flyToken);
    flyClient._init(this.flyToken);
    let fly = new flyio.Fly(flyClient);
    let app = fly.app("wing-preview-${util.sha256(opts.environmentId)}");
    let exists = app.exists();
    if exists {
      app.destroy();
    }
  }
}

struct RuntimeServiceProps {
  wingCloudUrl: str;
  flyToken: str?;
  flyOrgSlug: str?;
}

bring "@cdktf/provider-aws" as aws;
bring "cdktf" as cdktf;

// Previews environment runtime
pub class RuntimeService {
  logs: cloud.Bucket;
  pub api: cloud.Api;
  runtimeHandler: IRuntimeHandler;

  init(props: RuntimeServiceProps) {
    this.logs = new cloud.Bucket() as "deployment logs";

    let var bucketName: str = "";
    let var bucketRegion: str = "";
    let var awsAccessKeyId: str = "";
    let var awsSecretAccessKey: str = "";
    if util.tryEnv("WING_TARGET") == "sim" {
      this.runtimeHandler = new RuntimeHandler_sim();
    } else {
      let awsUser = new aws.iamUser.IamUser(name: "${this.node.addr}-user");
      let bucketArn: str = unsafeCast(this.logs).bucket.arn;
      bucketName = unsafeCast(this.logs).bucket.bucket;
      bucketRegion = unsafeCast(this.logs).bucket.region;
      let awsPolicy = new aws.iamUserPolicy.IamUserPolicy(
        user: awsUser.name,
        policy: Json.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: ["s3:*"],
              Effect: "Allow",
              Resource: "${bucketArn}/*",
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

    this.api = new cloud.Api();
    this.api.post("/", inflight (req) => {
      let body = Json.parse(req.body ?? "");
      let repo = body.get("repo").asStr();
      let sha = body.get("sha").asStr();
      let entryfile = body.get("entryfile").asStr();
      let environmentId = body.get("environmentId").asStr();
      let token = body.tryGet("token")?.tryAsStr();

      log("wing url: ${props.wingCloudUrl}");

      let url = this.runtimeHandler.start(
        gitToken: token,
        gitRepo: repo,
        gitSha: sha,
        entryfile: entryfile,
        wingCloudUrl: props.wingCloudUrl,
        environmentId: environmentId,
        logsBucketName: bucketName,
        logsBucketRegion: bucketRegion,
        awsAccessKeyId: awsAccessKeyId,
        awsSecretAccessKey: awsSecretAccessKey,
      );

      log("preview environment url: ${url}");

      return {
        status: 200,
        body: Json.stringify({
          url: url
        })
      };
    });

    this.api.delete("/", inflight (req) => {
      let body = Json.parse(req.body ?? "");
      let environmentId = body.get("environmentId").asStr();
      
      this.runtimeHandler.stop(
        environmentId: environmentId,
      );

      log("preview environment deleted: ${environmentId}");

      return {
        status: 200,
      };
    });

    test "deploy preview environment" {
      let res = http.post(this.api.url, body: Json.stringify({
        repo: "eladcon/examples",
        sha: "fix-api-basic-auth",
        entryfile: "examples/api-basic-auth-middleware/basic-auth.w"
      }));
    }
  }
}
