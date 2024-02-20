interface GetRedirectURLOptions {
  clientID: string;
  redirectURI: string;
  state: string;
}

export const getRedirectURL = (options: GetRedirectURLOptions) => {
  const url = new URL("https://accounts.google.com/o/oauth2/auth");
  url.searchParams.set("client_id", options.clientID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/userinfo.email",
  );
  url.searchParams.set("state", options.state);
  url.searchParams.set("redirect_uri", options.redirectURI);
  return url.toString();
};

// type TypedResponse<SuccessType, ErrorType = unknown> = Omit<
//   Response,
//   "ok" | "json"
// > &
//   (
//     | {
//         ok: true;
//         json: () => Promise<SuccessType>;
//       }
//     | {
//         ok: false;
//         json: () => Promise<ErrorType>;
//       }
//   );

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

export const getToken = async (options: GetTokenOptions) => {
  const response = await fetch("https://www.googleapis.com/oauth2/v4/token", {
    method: "POST",
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: options.clientID,
      client_secret: options.clientSecret,
      code: options.code,
      redirect_uri: options.redirectURI,
    }),
  });
  if (!response.ok) {
    const { error, error_description } = await response.json();
    throw new Error(`${error}: ${error_description}`);
  }
  return response.json() as Promise<GetTokenResponse>;
};

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

export const getUserInfo = async (options: GetUserInfoOptions) => {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.accessToken}`,
      },
    },
  );
  if (!response.ok) {
    const { error, error_description } = await response.json();
    throw new Error(`${error}: ${error_description}`);
  }
  return response.json() as Promise<GetUserInfoResponse>;
};
