import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";
import { Layout } from "../layout/layout.js";
import { wrpc } from "../utils/wrpc.js";

export const Component = () => {
  const authCheck = wrpc["auth.check"].useQuery(undefined, {
    retry: false,
  });

  return (
    <Layout>
      {authCheck.isError && <GithubLogin />}
      {(authCheck.isPending || authCheck.isSuccess) && <Outlet />}
    </Layout>
  );
};
