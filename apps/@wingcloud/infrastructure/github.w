bring http;

struct AuthTokens {
  access_token: str;
  expires_in: num;
  refresh_token: str;
  refresh_token_expires_in: num;
  token_type: str;
  scope: str;
}

struct ExchangeCodeForTokensOptions {
  code: str;
  clientId: str;
  clientSecret: str;
}

struct UserInstallation {
  id: num;
  account: str;
}

struct InstallationRepository {
  name: str;
}

struct Commit {
  message: str;
}

struct CommitResponse {
  sha: str;
  commit: Commit;
}

struct GetLastCommitOptions {
  token: str;
  owner: str;
  repo: str;
  default_branch: str;
}

pub class Exchange {
  pub static inflight codeForTokens(options: ExchangeCodeForTokensOptions): AuthTokens {
    // return AuthTokens {
    //   access_token: "at",
    //   expires_in: 1,
    //   refresh_token: "rt",
    //   refresh_token_expires_in: 1,
    //   token_type: "tt",
    //   scope: "*",
    // };

    let response = http.post("https://github.com/login/oauth/access_token", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: Json.stringify({
        code: options.code,
        client_id: options.clientId,
        client_secret: options.clientSecret,
      }),
    });

    if response.ok == false {
      throw "Failed to exchange code for tokens";
    }

    log("oauth = ${response.body}");
    return AuthTokens.fromJson(Json.parse(response.body));
  }

  extern "./src/github.ts" pub static inflight getLoginFromAccessToken(accessToken: str): str;
}

pub class Client {
  extern "./src/github.ts" pub static inflight listUserInstallations(token: str): Array<UserInstallation>;
  extern "./src/github.ts" pub static inflight listInstallationRepos(token: str, installationId: num): Array<InstallationRepository>;
  extern "./src/github.ts" pub static inflight getLastCommit(options: GetLastCommitOptions): CommitResponse;
}
