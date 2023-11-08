import { type PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";

import { Header } from "../components/header.js";
import { SpinnerLoader } from "../components/spinner-loader.js";
import { wrpc } from "../utils/wrpc.js";

export const Layout = ({ children }: PropsWithChildren) => {
  let authCheck;

  const location = useLocation();

  if (location.pathname !== "/") {
    try {
      authCheck = wrpc["auth.check"].useQuery(undefined, {
        throwOnError: true,
        retry: false,
      });
    } catch (error) {
      console.log(error);
      window.location.href = "/";
    }
  }

  return (
    <>
      {authCheck?.isLoading && (
        <div className="fixed inset-0 flex items-center justify-center">
          <SpinnerLoader />
        </div>
      )}

      {authCheck?.data?.userId && <Header />}

      {!authCheck?.isLoading && (
        <div className="p-6 space-y-4 w-full max-w-5xl mx-auto">{children}</div>
      )}
    </>
  );
};
