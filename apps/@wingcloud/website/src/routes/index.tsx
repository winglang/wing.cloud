import { Outlet, useLocation } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";

export const Component = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/" && <GithubLogin />}
      {location.pathname !== "/" && <Outlet />}
    </>
  );
};
