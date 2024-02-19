// const redirectURL = new URL("https://platypus-ready-lightly.ngrok-free.app/");
// // Can't add search params because Google OAuth doesn't allow it.
// // redirectURL.searchParams.set("intended", "/wrpc/oauth/callback/google");

// const oauthURL = new URL("https://accounts.google.com/o/oauth2/auth");
// oauthURL.searchParams.set(
//   "client_id",
//   "111131977542-cb4sikr59cm99gmitb6vnn0oee59jtnn.apps.googleusercontent.com",
// );
// oauthURL.searchParams.set("redirect_uri", redirectURL.toString());
// oauthURL.searchParams.set("response_type", "code");
// oauthURL.searchParams.set(
//   "scope",
//   "https://www.googleapis.com/auth/userinfo.email",
// );
// console.log(oauthURL.toString());
// process.exit(1);

const url = new URL(
  "https://platypus-ready-lightly.ngrok-free.app/?code=4%2F0AeaYSHAwF-kNG0soRpl-LZOxvMi3t8BzGGRloa_Gimye1eUQlrF1mFsQwD9gZBPZd8qFEQ&scope=email+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&authuser=0&hd=monada.co&prompt=none",
);
const code = url.searchParams.get("code")!;
// console.log(url.searchParams);
// process.exit(1);

// type TypedResponse<T> = Omit<Response, "json"> & {
//   json: () => Promise<T>;
// };

type TypedResponse<SuccessType, ErrorType = unknown> = Omit<
  Response,
  "ok" | "json"
> &
  (
    | {
        ok: true;
        json: () => Promise<SuccessType>;
      }
    | {
        ok: false;
        json: () => Promise<ErrorType>;
      }
  );

interface GetTokenOptions {
  clientID: string;
  clientSecret: string;
  code: string;
  redirectURI: string;
}

interface GetTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GetTokenErrorResponse {
  error: string;
  error_description: string;
}

const getToken = async (
  options: GetTokenOptions,
): Promise<TypedResponse<GetTokenResponse, GetTokenErrorResponse>> => {
  return fetch("https://www.googleapis.com/oauth2/v4/token", {
    method: "POST",
    // headers: {
    //   Accept: "application/json",
    //   ContentType: "application/json",
    // },
    // body: (() => {
    //   const form = new FormData();
    //   form.set("grant_type", "authorization_code");
    //   form.set("client_id", options.clientID);
    //   form.set("client_secret", options.clientSecret);
    //   form.set("code", options.code);
    //   form.set("redirect_uri", options.redirectURI);
    //   return form;
    // })(),
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: options.clientID,
      client_secret: options.clientSecret,
      code: options.code,
      redirect_uri: options.redirectURI,
    }),
  });
};

// const tokenResponse = await fetch(
//   "https://www.googleapis.com/oauth2/v4/token",
//   {
//     method: "POST",
//     body: (() => {
//       const form = new FormData();
//       form.set("grant_type", "authorization_code");
//       form.set(
//         "client_id",
//         "111131977542-cb4sikr59cm99gmitb6vnn0oee59jtnn.apps.googleusercontent.com",
//       );
//       form.set("client_secret", "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");
//       form.set("code", code);
//       form.set(
//         "redirect_uri",
//         "https://platypus-ready-lightly.ngrok-free.app/",
//       );

//       return form;
//     })(),
//   },
// );
// console.log(tokenResponse.ok, await tokenResponse.json());
const tokenResponse = await getToken({
  clientID:
    "111131977542-cb4sikr59cm99gmitb6vnn0oee59jtnn.apps.googleusercontent.com",
  clientSecret: "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",
  code,
  redirectURI: "https://platypus-ready-lightly.ngrok-free.app/",
});
if (!tokenResponse.ok) {
  const { error, error_description } = await tokenResponse.json();
  throw new Error(`${error}: ${error_description}`, { cause: tokenResponse });
}
const { access_token } = await tokenResponse.json();
console.log({ access_token });

// const { access_token } = {
//   access_token:
//     "ya29.a0AfB_byAB3siata5CL5pw36W96VRCto8NFdyk-8qWjGXGezhgIB3kPs9g7DWQo3_1tjXbYgrgRCLIqgVjJyT72cUsFw1m1apSlbwb7KNCevGfisxp7Qi3Nax1IVRpOBAsHFyzxdDG1t80p9K86JKNi3hyPy19ZGIRDT-uaCgYKATASARASFQHGX2MicI5LjBw2-JjusjsJ9gHQFA0171",
//   expires_in: 3599,
//   scope: "https://www.googleapis.com/auth/userinfo.email openid",
//   token_type: "Bearer",
//   id_token:
//     "eyJhbGciOiJSUzI1NiIsImtpZCI6ImVkODA2ZjE4NDJiNTg4MDU0YjE4YjY2OWRkMWEwOWE0ZjM2N2FmYzQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMTExMzE5Nzc1NDItY2I0c2lrcjU5Y205OWdtaXRiNnZubjBvZWU1OWp0bm4uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIxMTExMzE5Nzc1NDItY2I0c2lrcjU5Y205OWdtaXRiNnZubjBvZWU1OWp0bm4uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTEzNjYyMTQ5NDQ0MzUwNjgyNzMiLCJoZCI6Im1vbmFkYS5jbyIsImVtYWlsIjoiY3Jpc3RpYW5wQG1vbmFkYS5jbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiVlk5SmdVWEl4T1RjR2tWQ1BtckFNUSIsImlhdCI6MTcwODM2Nzk3NSwiZXhwIjoxNzA4MzcxNTc1fQ.J0gCrw8vUJ0wmK7DkZGcA87h1vxByoYmYd4lAdJquOuAcTuNuaZjl9iE-_NtYKtD4HFTqJx7DoilvgfzDe8FpsMoWxEtZo54dIz8chRoE59qzLJ2OXtnvdljjNcGHF5Wuo1yp5yjWkBAANJPjex5jIjZO6wOwRKLPMKgv0gsPdsbZ6RqKtVZezq19SBSHBSmEWkjXv9BEC-SNj8gbtT0lWIaKoqsJ84I3nteEKhXIo1L-YUcUht203wi9vbUMUe07WGZClWLCNcFKaMutS9QiJ7wWFjAW51Sue_3wq027Zx6TwJv4rlrenXakPl4tfzyWtOQTKduTgENeU_BXIJRjQ",
// };

interface GetUserInfoOptions {
  accessToken: string;
}

interface GetUserInfoResponse {
  sub: string;
  picture: string;
  email: string;
  email_verified: boolean;
  hd: string;
}

const getUserInfo = async (
  options: GetUserInfoOptions,
): Promise<TypedResponse<GetUserInfoResponse>> => {
  return await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.accessToken}`,
    },
  });
};

// const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
//   headers: {
//     Accept: "application/json",
//     Authorization: `Bearer ${access_token}`,
//   },
// });
// const response = await getUserInfo({ accessToken: access_token });
// console.log(response.ok, await response.json());
// const {} = {
//   sub: "111366214944435068273",
//   picture:
//     "https://lh3.googleusercontent.com/a-/ALV-UjW_4joFTejxtjbP0XXTmBnBaxKXZHdpGbRLv3f2eON32g=s96-c",
//   email: "cristianp@monada.co",
//   email_verified: true,
//   hd: "monada.co",
// };
