bring http;
bring cloud;
bring "./json-api.w" as json_api;
bring "./segment-analytics.w" as segment_analytics;

struct GetRedirectURLOptions {
  clientID: str;
  redirectURI: str;
  state: str;
}

struct GetTokenOptions {
  clientID: str;
  clientSecret: str;
  code: str;
  redirectURI: str;
}

struct GetTokenResponse {
  access_token: str;
  expires_in: num;
  scope: str;
  token_type: str;
  id_token: str;
}

struct GetUserInfoOptions {
  accessToken: str;
}

struct GetUserInfoResponse {
  sub: str;
  picture: str;
  email: str;
  email_verified: bool;
  hd: str;
}

struct QueueMessage {
  code: str;
  anonymousId: str;
}

class Util {
  extern "./util.js" pub static inflight encodeURIComponent(value: str): str;
  extern "./google-oauth.mts" pub static inflight getRedirectURL(options: GetRedirectURLOptions): str;

  pub static inflight getToken(options: GetTokenOptions): GetTokenResponse {
    let response = http.post(
      "https://www.googleapis.com/oauth2/v4/token",
      body: Json.stringify({
        code: options.code,
        client_id: options.clientID,
        client_secret: options.clientSecret,
        redirect_uri: options.redirectURI,
        grant_type: "authorization_code",
      }),
    );
    if !response.ok {
      throw "Failed to get token from Google OAuth.";
    }
    return GetTokenResponse.parseJson(response.body);
  }

  pub static inflight getUserInfo(options: GetUserInfoOptions): GetUserInfoResponse {
    let response = http.post(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer {options.accessToken}",
      },
    );
    if !response.ok {
      throw "Failed to get user info from Google OAuth.";
    }
    return GetUserInfoResponse.parseJson(response.body);
  }
}

pub struct GoogleOAuthCredentials {
  clientId: str;
  clientSecret: str;
}

pub struct GoogleOAuthProps {
  api: json_api.JsonApi;
  credentials: GoogleOAuthCredentials;
  redirectOrigin: str;
  analytics: segment_analytics.SegmentAnalytics;
}

pub class GoogleOAuth {
  new(props: GoogleOAuthProps) {
    props.api.get("/wrpc/console.signIn/google", inflight (request) => {
      let port = request.query.get("port");
      let anonymousId = request.query.get("anonymousId");
      let state = Json.stringify([port, anonymousId]);
      let redirectURI = "{props.redirectOrigin}/wrpc/console.signIn/google/callback";
      return {
        status: 302,
        headers: {
          location: Util.getRedirectURL({
            clientID: props.credentials.clientId,
            redirectURI: redirectURI,
            state: state,
          }),
        },
      };
    });

    let queue = new cloud.Queue();
    queue.setConsumer(inflight (message) => {
      let event = QueueMessage.parseJson(message);

      let token = Util.getToken(
        clientID: props.credentials.clientId,
        clientSecret: props.credentials.clientSecret,
        code: event.code,
        redirectURI: "{props.redirectOrigin}/wrpc/console.signIn/google/callback",
      );

      let userInfo = Util.getUserInfo(
        accessToken: token.access_token,
      );

      props.analytics.identify(
        anonymousId: event.anonymousId,
        traits: {
          email: userInfo.email,
          google: userInfo.sub,
        },
      );
      props.analytics.track(
        anonymousId: event.anonymousId,
        event: "console_sign_in",
        properties: {
          email: userInfo.email,
          google: userInfo.sub,
        },
      );
    });

    props.api.get("/wrpc/console.signIn/google/callback", inflight (request) => {
      let code = request.query.get("code");
      let state = Json.parse(request.query.get("state"));
      let port = state.getAt(0).asStr();
      let anonymousId = state.getAt(1).asStr();

      queue.push(Json.stringify(QueueMessage {
        code: code,
        anonymousId: anonymousId,
      }));

      return {
        status: 302,
        headers: {
          location: "http://localhost:{port}/?signedIn",
        },
      };
    });
  }
}
