import { useEffect } from "react";

import { EARLY_ACCESS_CODE_QUERY_PARAM } from "../../utils/wrpc.js";

import { LoginPage } from "./_components/login-page.js";

export const Component = () => {
  // TODO: Use state to prevent man-in-the-middle attacks.
  const { GITHUB_APP_CLIENT_ID, WINGCLOUD_ORIGIN } = wing.env;

  const AUTHORIZE_URL = (() => {
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.append("client_id", GITHUB_APP_CLIENT_ID);

    const redirectUrl = new URL(WINGCLOUD_ORIGIN);
    redirectUrl.pathname = "/wrpc/github.callback";

    const params = new URLSearchParams(location.search);
    const eacode = params.get(EARLY_ACCESS_CODE_QUERY_PARAM);
    if (eacode) {
      redirectUrl.searchParams.append(EARLY_ACCESS_CODE_QUERY_PARAM, eacode);
    }
    url.searchParams.append("redirect_uri", redirectUrl.toString());
    return url.toString();
  })();

  useEffect(() => {
    window.location.href = AUTHORIZE_URL;
  }, [AUTHORIZE_URL]);

  return <LoginPage />;
};
