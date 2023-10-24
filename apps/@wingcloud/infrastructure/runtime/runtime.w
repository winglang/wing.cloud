bring cloud;
bring http;
bring ex;
bring util;
bring "constructs" as constructs;
bring "../containers.w" as containers;
bring "../flyio" as flyio;
bring "./runtime-docker.w" as runtimeDocker;

struct RuntimeHandleOptions {
  gitToken: str?;
  gitRepo: str;
  gitSha: str;
  entryfile: str;
  logsBucketName: str;
  wingCloudUrl: str;
  environmentId: str;
}

interface IRuntimeHandler {
  inflight handleRequest(opts: RuntimeHandleOptions): str;
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

  pub inflight handleRequest(opts: RuntimeHandleOptions): str {
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
}

struct FlyRuntimeHandlerProps {
  flyToken: str;
  awsAccessKeyId: str;
  awsSecretAccessKey: str;
}

class RuntimeHandler_flyio impl IRuntimeHandler {
  flyToken: str;
  awsAccessKeyId: str;
  awsSecretAccessKey: str;
  image: runtimeDocker.RuntimeDockerImage;
  init(props: FlyRuntimeHandlerProps) {
    this.flyToken = props.flyToken;
    this.awsAccessKeyId = props.awsAccessKeyId;
    this.awsSecretAccessKey = props.awsSecretAccessKey;
    this.image = new runtimeDocker.RuntimeDockerImage();
  }

  pub inflight handleRequest(opts: RuntimeHandleOptions): str {
    let flyClient = new flyio.Client(this.flyToken);
    flyClient._init(this.flyToken);
    let fly = new flyio.Fly(flyClient);
    let app = fly.app("wing-preview-${util.nanoid(alphabet: "0123456789abcdefghijklmnopqrstuvwxyz", size: 10)}");
    let exists = app.exists();
    if !exists {
      app.create();
    }

    let env = MutMap<str>{
      "GIT_REPO" => opts.gitRepo,
      "GIT_SHA" => opts.gitSha,
      "ENTRYFILE" => opts.entryfile,
      "LOGS_BUCKET_NAME" => opts.logsBucketName,
      "WING_CLOUD_URL" => opts.wingCloudUrl,
      "ENVIRONMENT_ID" => opts.environmentId,
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
}

struct RuntimeServiceProps {
  wingCloudUrl: str;
  flyToken: str?;
  awsAccessKeyId: str?;
  awsSecretAccessKey: str?;
}

// Previews environment runtime
pub class RuntimeService {
  extern "../src/get-bucket-name.mts" static inflight getBucketName(): str;

  logs: cloud.Bucket;
  pub api: cloud.Api;
  runtimeHandler: IRuntimeHandler;

  init(props: RuntimeServiceProps) {
    this.logs = new cloud.Bucket() as "deployment logs";

    // TODO: use a function to generate the IAM role with the permissions to write to the bucket
    new cloud.Function(inflight () => {
      // permissions:
      this.logs.put;
    }) as "runtime function";

    if util.tryEnv("WING_TARGET") == "sim" {
      this.runtimeHandler = new RuntimeHandler_sim();
    } else {
      // TODO: We need better type guards for this.
      this.runtimeHandler = new RuntimeHandler_flyio(
        flyToken: props.flyToken ?? "",
        awsAccessKeyId: props.awsAccessKeyId ?? "",
        awsSecretAccessKey: props.awsSecretAccessKey ?? ""
      );
    }

    this.api = new cloud.Api();
    this.api.post("/", inflight (req) => {
      // hack to get bucket name in extern files
      this.logs.put("t", "t");

      let body = Json.parse(req.body ?? "");
      let repo = body.get("repo").asStr();
      let sha = body.get("sha").asStr();
      let entryfile = body.get("entryfile").asStr();
      let environmentId = body.get("environmentId").asStr();
      let token = body.tryGet("token")?.tryAsStr();
      let logsBucketName = RuntimeService.getBucketName();

      log("wing url: ${props.wingCloudUrl}");

      let url = this.runtimeHandler.handleRequest(
        gitToken: token,
        gitRepo: repo,
        gitSha: sha,
        entryfile: entryfile,
        wingCloudUrl: props.wingCloudUrl,
        logsBucketName: logsBucketName,
        environmentId: environmentId,
      );

      return {
        status: 200,
        body: Json.stringify({
          url: url
        })
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
