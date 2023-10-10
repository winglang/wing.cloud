bring cloud;
bring http;
bring ex;
bring util;
bring "./types/probot-types.w" as probot;
bring "./types/octokit-types.w" as octokit;
bring "./lowkeys-map.w" as lowkeys;
bring "./github-app.w" as github;
bring "./runtime/runtime-callbacks.w" as runtime_callbacks;

struct VerifyAndReceieveProps {
  id: str;
  name: str;
  signature: str;
  payload: str;
}

interface IProbotWebhooks {
  inflight on(name: str, handler: inflight (): void);
  inflight verifyAndReceive(props: VerifyAndReceieveProps);
}

interface IProbotAuth {
  inflight call(ProbotInstance, installationId: num): octokit.OctoKit; 
}

struct ProbotInstance {
  webhooks: IProbotWebhooks;
  auth: IProbotAuth;
}

struct TestResult {
  path: str;
  pass: bool;
}

struct TestResults {
  testResults: Array<TestResult>;
}

inflight class ProbotAdapter {
  extern "./src/probot.mts" pub static inflight createProbot(appId: str, privateKey: str): ProbotInstance;

  inflight var instance: ProbotInstance?;

  init() {
    this.instance = nil;
  }

  pub initialize(appId: str, privateKey: str) {
    this.instance = ProbotAdapter.createProbot(appId, privateKey);
  }

  pub handlePullRequstOpened(handler: inflight (probot.IPullRequestOpenedContext): void) {
    this.instance?.webhooks?.on("pull_request.opened", handler);
  }

  pub handlePullRequstSync(handler: inflight (probot.IPullRequestSyncContext): void) {
    this.instance?.webhooks?.on("pull_request.synchronize", handler);
  }

  pub verifyAndReceive(props: VerifyAndReceieveProps) {
    this.instance?.webhooks?.verifyAndReceive(props);
  }

  pub auth(installationId: num): octokit.OctoKit {
    if let kit = this.instance?.auth?.call(this.instance, installationId) {
      return kit;
    } else {
      throw "auth: fail to get octokit";
    }
  }
}

class ProbotApp {
  probotAppId: cloud.Secret;
  probotSecretKey: cloud.Secret;
  runtimeUrl: str;
  runtimeCallbacks: runtime_callbacks.RuntimeCallbacks;
  githubApp: github.GithubApp;
  prDb: ex.Table;
  inflight var adapter: ProbotAdapter;

  init(runtimeUrl: str, runtimeCallbacks: runtime_callbacks.RuntimeCallbacks) {
    this.probotAppId =  new cloud.Secret(name: "wing.cloud/probot/app_id") as "probotAppId";
    this.probotSecretKey = new cloud.Secret(name: "wing.cloud/probot/secret_key") as "probotSecretKey";
    this.runtimeUrl = runtimeUrl;
    this.runtimeCallbacks = runtimeCallbacks;

    this.prDb = new ex.Table(ex.TableProps{
      name: "wing.cloud/probot/prs",
      primaryKey: "environmentId",
      columns: {
        issue_number: ex.ColumnType.NUMBER,
        owner: ex.ColumnType.STRING,
        repo: ex.ColumnType.STRING,
        installation_id: ex.ColumnType.NUMBER
      }
    }) as "environments prs";

    this.githubApp = new github.GithubApp(this.probotAppId, this.probotSecretKey, inflight (req) => {
      this.listen();
      this.adapter.verifyAndReceive(this.getVerifyAndReceievePropsProps(req));

      return {
        status: 200
      };
    });

    let db = new ex.Table(ex.TableProps{
      name: "wing.cloud/probot/statuses",
      primaryKey: "id",
      columns: {
        environmentId: ex.ColumnType.STRING,
        status: ex.ColumnType.STRING,
        data: ex.ColumnType.STRING,
      }
    }) as "environments status";

    this.runtimeCallbacks.onStatus(inflight (event) => {
      let data = Json.deepCopyMut(Json.parse(event));
      if let d = data.tryGet("data") {
        data.set("data", Json.stringify(d));
      }
      db.insert(util.nanoid(), data);

      this.postComment(event);
    });
  }

  inflight getVerifyAndReceievePropsProps(req: cloud.ApiRequest): VerifyAndReceieveProps {
    let lowkeysHeaders = lowkeys.LowkeysMap.fromMap(req.headers ?? {});
    if !lowkeysHeaders.has("x-github-delivery") {
      throw "getVerifyProps: missing id header";
    }

    let id = lowkeysHeaders.get("x-github-delivery");

    if !lowkeysHeaders.has("x-github-event") {
      throw "getVerifyProps: missing name header";
    }

    let name = lowkeysHeaders.get("x-github-event");

    let var sig: str? = nil;
    if lowkeysHeaders.has("x-hub-signature-256") {
      sig = lowkeysHeaders.get("x-hub-signature-256");
    } elif lowkeysHeaders.has("x-hub-signature") {
      sig = lowkeysHeaders.get("x-hub-signature");
    } else {
      throw "getVerifyProps: missing sig header";
    }

    if req.body == nil {
      throw "getVerifyProps: missing body";
    }

    let body = req.body;

    return {
      id: id,
      name: name,
      signature: sig ?? "",
      payload: body ?? ""
    };
  }

  inflight init() {
    this.adapter = new ProbotAdapter();
  }

  inflight listen() {
    this.adapter = new ProbotAdapter();
    this.adapter.initialize(this.probotAppId.value(), this.probotSecretKey.value());
    this.adapter.handlePullRequstOpened(inflight (context: probot.IPullRequestOpenedContext): void => {
      let owner = context.payload.repository.owner.login;
      let repo = context.payload.repository.name;
      let options = {
        owner: owner,
        repo: repo,
        tree_sha: context.payload.pull_request.head.sha,
        recursive: "true"
      };  
      
      let resp = context.octokit.git.getTree(options);
      if resp.status != 200 {
        throw "getTree: failure: ${resp.status}, ${options}";
      }
      log("resp ${Json.stringify(resp.data.tree)}, ${Json.stringify(options)}");

      let entrypoints: MutArray<str> = MutArray<str>[];
      for file in resp.data.tree {
        if let path = file.path {
          if path.endsWith("main.w") {
            log("-- owner: ${owner}, repo: ${repo}, entryfile: ${path}");
            this.prDb.upsert(path, {
              owner: owner,
              repo: repo,
              issue_number: context.payload.pull_request.number,
              installation_id: context.payload.installation?.id
            });

            http.post(this.runtimeUrl, body: Json.stringify({
              repo: "${owner}/${repo}",
              sha: context.payload.pull_request.head.sha,
              entryfile: path
            }));

            break;
          }
        }
      }
    });

    this.adapter.handlePullRequstSync(inflight (context: probot.IPullRequestSyncContext): void => {
      let owner = context.payload.repository.owner.login;
      let repo = context.payload.repository.name;
      let options = {
        owner: owner,
        repo: repo,
        tree_sha: context.payload.pull_request.head.sha,
        recursive: "true"
      };  
      
      let resp = context.octokit.git.getTree(options);
      if resp.status != 200 {
        throw "getTree: failure: ${resp.status}, ${options}";
      }
      log("resp ${Json.stringify(resp.data.tree)}, ${Json.stringify(options)}");

      let entrypoints: MutArray<str> = MutArray<str>[];
      for file in resp.data.tree {
        if let path = file.path {
          if path.endsWith("main.w") {
            log("owner: ${owner}, repo: ${repo}, entryfile: ${path}");
            this.prDb.upsert(path, {
              owner: owner,
              repo: repo,
              issue_number: context.payload.pull_request.number,
              installation_id: context.payload.installation?.id
            });

            http.post(this.runtimeUrl, body: Json.stringify({
              repo: "${owner}/${repo}",
              sha: context.payload.pull_request.head.sha,
              entryfile: path
            }));

            break;
          }
        }
      }
    });
  }

  inflight postComment(event: str) {
    this.adapter = new ProbotAdapter();
    this.adapter.initialize(this.probotAppId.value(), this.probotSecretKey.value());

    let data = Json.parse(event);
    if let item = this.prDb.tryGet(data.get("environmentId").asStr()) {
      let var testsString = "---";
      if data.get("status").asStr() == "tests" {
        let testResults = data.get("data").get("testResults");
        testsString = "";
        let var i = 0;
        while true {
          if let testResult = testResults.tryGetAt(i) {
            let var icon = "✅";
            if !testResult.get("pass").asBool() {
              icon = "❌";
            }
            testsString = "${icon} ${testResult.get("path").asStr()}<br> ${testsString}";
            i += 1;
          } else {
            break;
          }
        }
      }
      let tableRows = "| ${data.get("environmentId").asStr()} | ${data.get("status").asStr()} | --- | ${testsString} | ${std.Datetime.utcNow()} |";
      let commentBody = "
| Entry Point     | Status | Preview | Tests | Updated (UTC) |
| --------------- | ------ | ------- | ----- | -------------- |
${tableRows}
";
      this.adapter.auth(item.get("installation_id").asNum()).issues.createComment(
        owner: item.get("owner").asStr(),
        repo: item.get("repo").asStr(),
        issue_number: item.get("issue_number").asNum(),
        body: commentBody
      );
    }
  }
}
