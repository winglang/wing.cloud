bring cloud;
bring util;
bring http;
bring "cdktf" as cdktf;
bring "./environments.w" as environments;
bring "./environment-manager.w" as environment_manager;
bring "./users.w" as users;
bring "./apps.w" as apps;
bring "./status-reports.w" as status_reports;
bring "./probot.w" as probot;
bring "./probot-adapter.w" as adapter;
bring "./types/probot-types.w" as probotTypes;
bring "./lowkeys-map.w" as lowkeys;

struct GithubAppProps {
  runtimeUrl: str;
  environments: environments.Environments;
  environmentManager: environment_manager.EnvironmentManager;
  users: users.Users;
  apps: apps.Apps;
  siteDomain: str;
}

pub class GithubApp {
  api: cloud.Api;
  appId: cloud.Secret;
  privateKey: cloud.Secret;
  pub webhookUrl: str;

  extern "./src/create-github-app-jwt.mts" pub static inflight createGithubAppJwt(appId: str, privateKey: str): str;

  new(props: GithubAppProps) {
    this.api = new cloud.Api();
    this.webhookUrl = this.api.url;
    let adapter = new adapter.ProbotAdapter();
    this.appId = adapter.appId;
    this.privateKey = adapter.secretKey;

    if util.tryEnv("WING_TARGET") == "sim" {
      bring "./node_modules/@wingcloud/ngrok/index.w" as ngrok;

      let devNgrok = new ngrok.Ngrok(
        url: this.webhookUrl,
        domain: util.tryEnv("NGROK_DOMAIN"),
      );

      this.webhookUrl = devNgrok.url;
    }

    let updateGithubWebhook = inflight () => {
      this.updateWebhookUrl("{this.webhookUrl}/webhook");
    };

    new cloud.OnDeploy(updateGithubWebhook);

    new cdktf.TerraformOutput(value: this.webhookUrl) as "Probot API URL";

    let queue = new cloud.Queue(timeout: 6m);

    let probotApp = new probot.ProbotApp({
      runtimeUrl: props.runtimeUrl,
      environments: props.environments,
      environmentManager: props.environmentManager,
      users: props.users,
      apps: props.apps,
      siteDomain: props.siteDomain,
    });

    this.api.post("/webhook", inflight (req) => {
        queue.push(
          Json.stringify(this.getVerifyAndReceievePropsProps(req)),
        );
        return {
          status: 200
        };
      }
    );

    queue.setConsumer(inflight (message) => {
      log("receive message: {message}");
      let props = probotTypes.VerifyAndReceieveProps.fromJson(Json.parse(message));
      probotApp.listen(props);
    });
  }

  // used in test only right now
  pub inflight createGithubAppJwtToken(): str {
    return GithubApp.createGithubAppJwt(this.appId.value(), this.privateKey.value());
  }

  pub inflight getVerifyAndReceievePropsProps(req: cloud.ApiRequest): probotTypes.VerifyAndReceieveProps {
    let lowkeysHeaders = lowkeys.LowkeysMap.fromMap(req.headers ?? {});
    if !lowkeysHeaders.has("x-github-delivery") {
      throw "getVerifyProps: missing id header";
    }

    let id = lowkeysHeaders.get("x-github-delivery");

    if !lowkeysHeaders.has("x-github-event") {
      throw "getVerifyProps: missing name header";
    }

    let name = lowkeysHeaders.get("x-github-event");

    let signature = lowkeysHeaders.get("x-hub-signature-256");

    if let payload = req.body {
      return {
        id: id,
        name: name,
        signature: signature,
        payload: payload,
      };
    }

    throw "getVerifyProps: missing body";
  }

  pub inflight updateWebhookUrl(url: str) {
    let jwt = GithubApp.createGithubAppJwt(this.appId.value(), this.privateKey.value());

    let res = http.patch(
      "https://api.github.com/app/hook/config",
      headers: {
        "Accept" => "application/vnd.github+json",
        "Authorization" => "Bearer {jwt}",
        "X-GitHub-Api-Version" => "2022-11-28"
      },
      body: Json.stringify({
        url: url
      }),
    );

    if (res.status == 200) {
      log("GitHub app: webhook url updated: {url}");
    }
    else {
      log("GitHub app: failed to update the webhook url: {res.body}");
      log("You have to manually update your webhook URL to {url}");
    }
  }
}
