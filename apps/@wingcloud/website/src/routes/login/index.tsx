import { useEffect } from "react";

import { HeaderSkeleton } from "../../components/header-skeleton.js";

export const Component = () => {
  // TODO: Use state to prevent man-in-the-middle attacks.
  const { GITHUB_APP_CLIENT_ID, WINGCLOUD_ORIGIN } = wing.env;

  const AUTHORIZE_URL = (() => {
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.append("client_id", GITHUB_APP_CLIENT_ID);

    url.searchParams.append(
      "redirect_uri",
      `${WINGCLOUD_ORIGIN}/wrpc/github.callback`,
    );
    return url.toString();
  })();

  useEffect(() => {
    window.location.href = AUTHORIZE_URL;
  }, [AUTHORIZE_URL]);

  return (
    <>
      <HeaderSkeleton />
    </>
  );
};
