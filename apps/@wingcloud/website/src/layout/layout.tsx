import clsx from "clsx";
import { useMemo, type PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";

import { Header } from "../components/header.js";
import { SpinnerLoader } from "../components/spinner-loader.js";
import { wrpc } from "../utils/wrpc.js";

export const Layout = ({ children }: PropsWithChildren) => {
  let authCheck;

  const location = useLocation();

  const fullWidthPage = useMemo(() => {
    // Full screen content for the console preview
    if (/\/apps\/[^/]+\/[^/]+\/preview\/?/.test(location.pathname)) {
      return true;
    }
    return false;
  }, [location.pathname]);

  if (location.pathname !== "/apps") {
    try {
      authCheck = wrpc["auth.check"].useQuery(undefined, {
        throwOnError: true,
        retry: false,
      });
    } catch (error) {
      console.log(error);
      window.location.href = "/apps";
    }
  }

  return (
    <>
      {authCheck?.isLoading && (
        <div className="fixed inset-0 flex items-center justify-center">
          <SpinnerLoader />
        </div>
      )}

      <div className="absolute inset-0 flex flex-col">
        {authCheck?.data?.userId && <Header />}

        {!authCheck?.isLoading && (
          <div
            className={clsx(
              "transition-all",
              "w-full flex-grow overflow-auto",
              !fullWidthPage &&
                "max-w-5xl mx-auto py-4 px-4 sm:px-6 sm:py-6 transition-all",
            )}
          >
            {children}
          </div>
        )}
      </div>
    </>
  );
};
