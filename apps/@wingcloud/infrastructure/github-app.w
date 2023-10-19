bring cloud;
bring util;
bring http;

class GithubApp {
  api: cloud.Api;
  appId: cloud.Secret;
  privateKey: cloud.Secret;
  pub webhookUrl: str;

  extern "./src/create-github-app-jwt.mts" pub static inflight createGithubAppJwt(appId: str, privateKey: str): str;

  init(appId: cloud.Secret, privateKey: cloud.Secret, handler: inflight (cloud.ApiRequest): cloud.ApiResponse) {
    this.api = new cloud.Api();
    this.webhookUrl = this.api.url;
    this.api.post("/webhook", handler);
    this.appId = appId;
    this.privateKey = privateKey;
  }

  pub inflight updateCallbackUrl(url: str) {
    let jwt = GithubApp.createGithubAppJwt(this.appId.value(), this.privateKey.value());

    let res = http.patch(
      "https://api.github.com/app/callback_url",
      headers: {
        "Accept" => "application/vnd.github+json",
        "Authorization" => "Bearer ${jwt}",
        "X-GitHub-Api-Version" => "2022-11-28"
      },
      body: Json.stringify({
        callback_url: url
    }));

    if (res.status == 200) {
      log("GitHub app: callback url updated: ${url}");
    }
    else {
      log("GitHub app: failed to update the callback url: ${res.body}");
    }
  }

  pub inflight updateWebhookUrl(url: str) {
    let jwt = GithubApp.createGithubAppJwt(this.appId.value(), this.privateKey.value());

    let res = http.patch(
      "https://api.github.com/app/hook/config",
      headers: {
        "Accept" => "application/vnd.github+json",
        "Authorization" => "Bearer ${jwt}",
        "X-GitHub-Api-Version" => "2022-11-28"
      },
      body: Json.stringify({
      url: url
    }));

    if (res.status == 200) {
      log("GitHub app: webhook url updated: ${url}");
    }
    else {
      log("GitHub app: failed to update the  webhook url: ${res.body}");
    }
  }
}
