import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";
import { Layout } from "../layout/layout.js";

export const Component = () => {
  const location = useLocation();
  const pathname = useMemo(() => {
    return location.pathname;
  }, [location.pathname]);

  return (
    <Layout>
      {pathname === "/" && <GithubLogin />}
      {pathname !== "/" && <Outlet />}
    </Layout>
  );
};
