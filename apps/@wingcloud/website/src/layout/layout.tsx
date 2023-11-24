import clsx from "clsx";
import { useMemo, type PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";

import { Header } from "../components/header.js";

export const Layout = ({ children }: PropsWithChildren) => {
  let authCheck;

  const location = useLocation();

  const fullWidthPage = useMemo(() => {
    // Full screen content for the console preview
    if (/\/apps\/[^/]+\/[^/]+\/console\/?/.test(location.pathname)) {
      return true;
    }
    return false;
  }, [location.pathname]);

  return (
    <>
      <div className="absolute inset-0 flex flex-col">
        {location.pathname !== "/" && <Header />}
        <div
          className={clsx(
            "w-full flex-grow overflow-auto",
            !fullWidthPage && "max-w-5xl mx-auto py-4 px-4 sm:px-6 sm:py-6",
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
};
