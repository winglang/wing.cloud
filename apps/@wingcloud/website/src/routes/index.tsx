import { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { AuthDataProviderContext } from "../data-store/auth-data-provider.js";

export const Component = () => {
  const navigate = useNavigate();

  const { error: authError } = useContext(AuthDataProviderContext);

  useEffect(() => {
    if (authError) {
      navigate("/login");
    }
  }, [authError]);

  return (
    <>
      {location.pathname !== "/" && (
        <>
          <Outlet />
        </>
      )}
    </>
  );
};
