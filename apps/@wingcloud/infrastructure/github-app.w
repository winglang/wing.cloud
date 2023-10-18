bring cloud;
bring util;
bring http;

class GithubApp {
  pub webhook: cloud.Api;
  appId: cloud.Secret;
  privateKey: cloud.Secret;

  extern "./src/create-github-app-jwt.mts" pub static inflight createGithubAppJwt(appId: str, privateKey: str): str;

  init(appId: cloud.Secret, privateKey: cloud.Secret, handler: inflight (cloud.ApiRequest): cloud.ApiResponse) {
    this.webhook = new cloud.Api();
    this.webhook.post("/webhook", handler);
    this.appId = appId;
    this.privateKey = privateKey;

    let deploy = new cloud.OnDeploy(inflight () => {
      this.listen();
    });
  }

  inflight listen() {
    let var publicUrl = this.webhook.url;

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
