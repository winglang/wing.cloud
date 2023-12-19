import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { ErrorBoundary } from "../components/error-boundary.js";
import { GithubLogin } from "../components/github-login.js";
import { SpinnerLoader } from "../components/spinner-loader.js";
import { wrpc } from "../utils/wrpc.js";

export const AppPage = () => {
  const user = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (user.isError) {
      navigate("/");
    }
  }, [user.isError]);

  return (
    <>
      {user.isLoading && (
        <div className="fixed inset-0 flex items-center justify-center">
          <SpinnerLoader />
        </div>
      )}
      {!user.isLoading && <Outlet />}
    </>
  );
};

export const Component = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/" && <GithubLogin />}
      {location.pathname !== "/" && (
        <ErrorBoundary>
          <AppPage />
        </ErrorBoundary>
      )}
    </>
  );
};
