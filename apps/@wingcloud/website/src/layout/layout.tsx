import { type PropsWithChildren } from "react";

import { Header } from "../components/header.js";
import { SpinnerLoader } from "../components/spinner-loader.js";
import { wrpc } from "../utils/wrpc.js";

export const Layout = ({ children }: PropsWithChildren) => {
  let authCheck;

  if (location.pathname !== "/") {
    try {
      authCheck = wrpc["auth.check"].useQuery(undefined, {
        throwOnError: true,
        retry: false,
      });

      if (authCheck.isLoading) {
        return (
          <div className="fixed inset-0 flex items-center justify-center">
            <SpinnerLoader />
          </div>
        );
      }
    } catch (error) {
      console.log(error);
      window.location.href = "/";
    }
  }

  return (
    <div className="inse-0">
      <Header showUserMenu={!!authCheck?.data?.userId} />
      <div className="p-6 space-y-4 w-full max-w-5xl mx-auto">{children}</div>
    </div>
  );
};
