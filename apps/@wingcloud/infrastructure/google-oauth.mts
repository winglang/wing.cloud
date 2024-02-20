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
