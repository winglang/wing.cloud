import clsx from "clsx";
import { useMemo, type PropsWithChildren, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { Header } from "../components/header.js";
import { wrpc } from "../utils/wrpc.js";

export const Layout = ({ children }: PropsWithChildren) => {
  const location = useLocation();

  const fullWidthPage = useMemo(() => {
    // Full screen content for the console preview
    if (/\/apps\/[^/]+\/[^/]+\/preview\/?/.test(location.pathname)) {
      return true;
    }
    return false;
  }, [location.pathname]);

  const authCheck = wrpc["auth.check"].useQuery(undefined, {
    enabled: location.pathname !== "/apps",
    retry: false,
  });

  useEffect(() => {
    if (location.pathname === "/apps") {
      return;
    }

    if (authCheck.isError) {
      window.location.href = "/apps";
    }
  }, [authCheck.isError, location.pathname]);

  return (
    <>
      <Header />

      <div
        className={clsx(
          "w-full flex-grow overflow-auto",
          !fullWidthPage && "max-w-5xl mx-auto py-4 px-4 sm:px-6 sm:py-6",
        )}
      >
        {children}
      </div>
    </>
  );
};
