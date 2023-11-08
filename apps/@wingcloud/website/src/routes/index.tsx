import { Outlet, useLocation } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";
import { Header } from "../components/header.js";
import { Layout } from "../layout/layout.js";

export const Component = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/" && (
        <Layout>
          <GithubLogin />
        </Layout>
      )}
      {location.pathname !== "/" && (
        <div>
          <Header />
          <Layout>
            <Outlet />
          </Layout>
        </div>
      )}
    </>
  );
};
