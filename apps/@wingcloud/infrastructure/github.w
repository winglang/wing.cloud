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

class Exchange {
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

    return AuthTokens.fromJson(Json.parse(response.body ?? ""));
  }
}
