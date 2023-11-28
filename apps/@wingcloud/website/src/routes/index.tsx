import { Outlet, useLocation } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";

export const Component = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/" && (
        <div className="p-8">
          <GithubLogin />
        </div>
      )}

      {location.pathname !== "/" && <Outlet />}
    </>
  );
};
