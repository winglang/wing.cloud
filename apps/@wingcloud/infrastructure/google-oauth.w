// bring ex;
bring "./json-api.w" as json_api;

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

class Util {
  extern "./util.js" pub static inflight encodeURIComponent(value: str): str;
  extern "./google-oauth.mts" pub static inflight getRedirectURL(options: GetRedirectURLOptions): str;
  extern "./google-oauth.mts" pub static inflight getToken(options: GetTokenOptions): GetTokenResponse;
  extern "./google-oauth.mts" pub static inflight getUserInfo(options: GetUserInfoOptions): GetUserInfoResponse;
}

pub struct GoogleOAuthCredentials {
  clientId: str;
  clientSecret: str;
}

pub struct GoogleOAuthProps {
  api: json_api.JsonApi;
  credentials: GoogleOAuthCredentials;
  redirectDomain: str;
}

pub class GoogleOAuth {
  new(props: GoogleOAuthProps) {
    // let table = new ex.Table(
    //   columns: {
    //     "id": ex.ColumnType.STRING,
    //     "name": ex.ColumnType.STRING,
    //   },
    // );
    props.api.get("/wrpc/console.signIn/google", inflight (request) => {
      let port = request.query.get("port");
      let anonymousId = request.query.get("anonymousId");
      let state = Json.stringify([port, anonymousId]);
      let redirectURI = "https://{props.redirectDomain}/wrpc/console.signIn/google/callback";
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

    props.api.get("/wrpc/console.signIn/google/callback", inflight (request) => {
      let code = request.query.get("code");
      let state = Json.parse(request.query.get("state"));
      log("state = {state}");
      let port = state.getAt(0).asStr();
      let anonymousId = state.getAt(1).asStr();
      log("code = {code}");
      log("port = {port}");
      log("anonymousId = {anonymousId}");
      let token = Util.getToken(
        clientID: props.credentials.clientId,
        clientSecret: props.credentials.clientSecret,
        code: code,
        redirectURI: "https://{props.redirectDomain}/wrpc/console.signIn/google/callback",
      );
      log(unsafeCast(token));

      let userInfo = Util.getUserInfo(
        accessToken: token.access_token,
      );
      log(unsafeCast(userInfo));
      // let [port, anonymousId] = Json.parse(Util.inflight.decodeURIComponent(state));
      // let response = props.api.post("https://accounts.google.com/o/oauth2/token", {
      //   headers: {
      //     "Content-Type": "application/x-www-form-urlencoded",
      //   },
      //   body: `code=${code}&client_id=${props.credentials.clientId}&client_secret=${props.credentials.clientSecret}&redirect_uri=http://localhost:${port}/wrpc/console.signIn/google/callback&grant_type=authorization_code`,
      // });
      // let json = Json.parse(response.body);
      // let accessToken = json.access_token;
      // let idToken = json.id_token;
      // let userInfo = props.api.get("https://www.googleapis.com/oauth2/v1/userinfo", {
      //   headers: {
      //     "Authorization": `Bearer ${accessToken}`,
      //   },
      // });
      // let user = Json.parse(userInfo.body);
      // return {
      //   status: 200,
      //   body: Json.stringify({
      //     idToken: idToken,
      //     user: user,
      //     anonymousId: anonymousId,
      //   }),
      // };
      return {
        status: 200,
        body: "ok",
      };
    });
  }
}
