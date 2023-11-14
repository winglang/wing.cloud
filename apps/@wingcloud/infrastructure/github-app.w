bring cloud;
bring util;
bring http;

pub class GithubApp {
  api: cloud.Api;
  appId: str;
  privateKey: str;
  pub webhookUrl: str;

  extern "./src/create-github-app-jwt.mts" pub static inflight createGithubAppJwt(appId: str, privateKey: str): str;

  new(appId: str, privateKey: str, handler: inflight (cloud.ApiRequest): cloud.ApiResponse) {
    this.api = new cloud.Api();
    this.webhookUrl = this.api.url;
    this.api.post("/webhook", handler);
    this.appId = appId;
    this.privateKey = privateKey;
  }

  pub inflight createGithubAppJwtToken(): str {
    return GithubApp.createGithubAppJwt(this.appId, this.privateKey);
  }

  pub inflight updateWebhookUrl(url: str) {
    let jwt = GithubApp.createGithubAppJwt(this.appId, this.privateKey);

    let res = http.patch(
      "https://api.github.com/app/hook/config",
      headers: {
        "Accept" => "application/vnd.github+json",
        "Authorization" => "Bearer ${jwt}",
        "X-GitHub-Api-Version" => "2022-11-28"
      },
      body: Json.stringify({
        url: url
      }),
    );

    if (res.status == 200) {
      log("GitHub app: webhook url updated: ${url}");
    }
    else {
      log("GitHub app: failed to update the webhook url: ${res.body}");
      log("You have to manually update your webhook URL to ${url}");
    }
  }
}
