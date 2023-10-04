bring cloud;
bring util;
bring http;
bring "./ngrok.w" as ngrok;

class GithubApp {
  webhook: cloud.Api;
  appId: cloud.Secret;
  privateKey: cloud.Secret;
  ngrok: ngrok.Ngrok?;

  extern "./src/create-github-app-jwt.mts" pub static inflight createGithubAppJwt(appId: str, privateKey: str): str;

  init(appId: cloud.Secret, privateKey: cloud.Secret, handler: inflight (cloud.ApiRequest): cloud.ApiResponse) {
    this.webhook = new cloud.Api();
    this.webhook.post("/", handler);
    this.appId = appId;
    this.privateKey = privateKey;

    if util.tryEnv("WING_TARGET") == "sim" {
      this.ngrok = new ngrok.Ngrok(this.webhook.url);
    }

    let deploy = new cloud.OnDeploy(inflight () => {
      this.listen();
    });

    if let ngrok = this.ngrok {
      deploy.node.addDependency(ngrok);
    }
  }

  inflight listen() {
    let var publicUrl = this.webhook.url;
    log("2222 ${this.ngrok}");
    if let ngrok = this.ngrok {
      publicUrl = ngrok.waitForUrl();
    }

    log("111, ${publicUrl}");

    let jwt = GithubApp.createGithubAppJwt(this.appId.value(), this.privateKey.value());

    let res = http.patch(
      "https://api.github.com/app/hook/config",
      headers: {
        "Accept" => "application/vnd.github+json",
        "Authorization" => "Bearer ${jwt}",
        "X-GitHub-Api-Version" => "2022-11-28"
      },
      body: Json.stringify({
      url: publicUrl
    }));

    log("${res.status}, ${jwt}");
  }
}
