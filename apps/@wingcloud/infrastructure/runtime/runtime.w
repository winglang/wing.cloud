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
}

interface IRuntimeHandler {
  inflight handleRequest(opts: RuntimeHandleOptions): str;
}

class RuntimeHandler_sim impl IRuntimeHandler {
  container: containers.Container_sim;
  init() {
    this.container = new containers.Container_sim(name: "previews-runtime", image: "../runtime", args: {
      "SETUP_DOCKER": "false",
    },  port: 3000, privileged: true, readiness: "/");

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
      "WING_CLOUD_URL" => opts.wingCloudUrl
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

class RuntimeHandler_flyio impl IRuntimeHandler {
  flyToken: cloud.Secret;
  awsAccessKeyId: cloud.Secret;
  awsSecretAccessKey: cloud.Secret;
  image: runtimeDocker.RuntimeDockerImage;
  init() {
    this.flyToken = new cloud.Secret(name: "wing.cloud/runtime/flyToken") as "flyToken";
    this.awsAccessKeyId = new cloud.Secret(name: "wing.cloud/runtime/awsAccessKeyId") as "awsAccessKeyId";
    this.awsSecretAccessKey = new cloud.Secret(name: "wing.cloud/runtime/awsSecretAccessKey") as "awsSecretAccessKey";
    this.image = new runtimeDocker.RuntimeDockerImage();
  }

  pub inflight handleRequest(opts: RuntimeHandleOptions): str {
    let flyClient = new flyio.Client(this.flyToken.value());
    flyClient._init(this.flyToken.value());
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
      "WING_CLOUD_URL" => opts.wingCloudUrl
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

// Previews environment runtime
class RuntimeService {
  extern "../src/get-bucket-name.mts" static inflight getBucketName(): str;

  logs: cloud.Bucket;
  pub api: cloud.Api;
  runtimeHandler: IRuntimeHandler;

  init(wingCloudUrl: str) {
    this.logs = new cloud.Bucket() as "deployment logs";

    // TODO: use a function to generate the IAM role with the permissions to write to the bucket
    new cloud.Function(inflight () => {
      // permissions:
      this.logs.put;
    }) as "runtime function";

    if util.tryEnv("WING_TARGET") == "sim" {
      this.runtimeHandler = new RuntimeHandler_sim();
    } else {
      this.runtimeHandler = new RuntimeHandler_flyio();
    }

    this.api = new cloud.Api();
    this.api.post("/", inflight (req) => {
      // hack to get bucket name in extern files
      this.logs.put("t", "t");

      let body = Json.parse(req.body ?? "");
      let repo = body.get("repo").asStr();
      let sha = body.get("sha").asStr();
      let entryfile = body.get("entryfile").asStr();
      let token = body.tryGet("token")?.tryAsStr();
      let logsBucketName = RuntimeService.getBucketName();

      log("wing url: ${wingCloudUrl}");

      this.runtimeHandler.handleRequest(
        gitToken: token,
        gitRepo: repo,
        gitSha: sha,
        entryfile: entryfile,
        wingCloudUrl: wingCloudUrl,
        logsBucketName: logsBucketName
      );

      return {
        status: 200,
        body: Json.stringify({
          // url
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
