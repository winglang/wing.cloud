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

struct Owner {
  login: str;
  avatar_url: str;
}

struct Repository {
  id: num;
  name: str;
  full_name: str;
  private: bool;
  owner: Owner;
  default_branch: str;
  url: str;
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

struct GetRepositoryOptions {
  token: str;
  owner: str;
  repo: str;
}

struct GetPullRequestOptions {
  token: str;
  owner: str;
  repo: str;
  pull_number: str;
}

struct PullRequest {
  id: num;
  number: num;
  title: str;
  body: str;
}

pub class Exchange {
  pub static inflight codeForTokens(options: ExchangeCodeForTokensOptions): AuthTokens {
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
    return AuthTokens.fromJson(Json.parse(response.body ?? ""));
  }

  extern "./src/github.ts" pub static inflight getLoginFromAccessToken(accessToken: str): str;
}

pub class Client {
  extern "./src/github.ts" pub static inflight listUserInstallations(token: str): Array<UserInstallation>;
  extern "./src/github.ts" pub static inflight listInstallationRepos(token: str, installationId: num): Array<InstallationRepository>;
  extern "./src/github.ts" pub static inflight getLastCommit(options: GetLastCommitOptions): CommitResponse;
  extern "./src/github.ts" pub static inflight getRepository(options: GetRepositoryOptions): Repository;
  extern "./src/github.ts" pub static inflight getPullRequest(options: GetPullRequestOptions): PullRequest;
}
