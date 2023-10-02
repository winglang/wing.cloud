bring cloud;
bring http;
bring ex;
bring util;
bring "constructs" as constructs;
bring "../containers.w" as containers;
bring "../flyio" as flyio;

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
  extern "./src/fly.mts" static inflight handler(
    imageName: str,
    repo: str,
    entryfile: str,
    flyToken: str,
    wingApiUrl: str,
    awsAccessKeyId: str,
    awsSecretAccessKey: str
  ): str;

  flyToken: cloud.Secret;
  awsAccessKeyId: cloud.Secret;
  awsSecretAccessKey: cloud.Secret;
  init() {
    this.flyToken = new cloud.Secret(name: "wing.cloud/runtime/flyToken") as "flyToken";
    this.awsAccessKeyId = new cloud.Secret(name: "wing.cloud/runtime/awsAccessKeyId") as "awsAccessKeyId";
    this.awsSecretAccessKey = new cloud.Secret(name: "wing.cloud/runtime/awsSecretAccessKey") as "awsSecretAccessKey";
  }

  pub inflight handleRequest(opts: RuntimeHandleOptions): str {
    // TODO: use opts.logsBucketName
    let fly = new flyio.Fly(new flyio.Client(this.flyToken.value()));
    let app = fly.app("");

    let env = MutMap<str>{
      "GIT_REPO" => opts.gitRepo,
      "GIT_SHA" => opts.gitSha,
      "ENTRYFILE" => opts.entryfile,
      "LOGS_BUCKET_NAME" => "stam", // opts.logsBucketName,
      "WING_CLOUD_URL" => opts.wingCloudUrl
    };

    if let token = opts.gitToken {
      env.set("GIT_TOKEN", token);
    }
    // app.update(imageName: );

    let url = RuntimeHandler_flyio.handler(
      "registry.fly.io/wing-runtime-flyio-test:deployment-01H9ZGZX4Y64EYJ6TCT2Y4YDFV",
      opts.gitRepo,
      opts.entryfile,
      this.flyToken.value(),
      opts.wingCloudUrl,
      this.awsAccessKeyId.value(),
      this.awsSecretAccessKey.value());

    return "";
  }
}

// Previews environment runtime
class RuntimeService {
  extern "./src/get-bucket-name.mts" static inflight getBucketName(): str;

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
      http.post(this.api.url, body: Json.stringify({
        repo: "eladcon/examples",
        entryfile: "examples/redis/main.w"
      }));
    }
  }
}
