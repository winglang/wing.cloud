import { Outlet, useLocation } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";
import { Layout } from "../layout/layout.js";

export const Component = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/" && <GithubLogin />}
      {location.pathname !== "/" && (
        <Layout>
          <Outlet />
        </Layout>
      )}
    </>
  );
};
