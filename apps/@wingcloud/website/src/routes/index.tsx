import { useContext, useEffect, useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { AuthDataProviderContext } from "../data-store/auth-data-provider.js";

const ROUTES_WITHOUT_AUTH = new Set(["/", "/login"]);

export const Component = () => {
  const navigate = useNavigate();

  const { error: authError } = useContext(AuthDataProviderContext);

  const routeRequiresAuth = useMemo(
    () => !ROUTES_WITHOUT_AUTH.has(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    if (routeRequiresAuth && authError) {
      navigate("/login");
    }
  }, [routeRequiresAuth, authError]);

  return <>{(!routeRequiresAuth || !authError) && <Outlet />}</>;
};
