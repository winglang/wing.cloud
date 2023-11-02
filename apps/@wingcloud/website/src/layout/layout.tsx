import { type PropsWithChildren } from "react";

import { SpinnerLoader } from "../components/spinner-loader.js";
import { wrpc } from "../utils/wrpc.js";

export const Layout = ({ children }: PropsWithChildren) => {
  if (location.pathname !== "/") {
    const authCheck = wrpc["auth.check"].useQuery({});

    if (authCheck.isLoading) {
      return (
        <div className="fixed inset-0 flex items-center justify-center">
          <SpinnerLoader />
        </div>
      );
    }

    if (authCheck.isError) {
      window.location.href = "/";
    }
  }

  return <div className="inset-0">{children}</div>;
};
