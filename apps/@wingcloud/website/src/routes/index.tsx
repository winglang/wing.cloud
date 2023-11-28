import { Outlet, useLocation } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";
import { Layout } from "../layout/layout.js";

export const Component = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/" && (
        <div className="p-8">
          <GithubLogin />
        </div>
      )}

      {location.pathname !== "/" && (
        <Layout>
          <Outlet />
        </Layout>
      )}
    </>
  );
};
