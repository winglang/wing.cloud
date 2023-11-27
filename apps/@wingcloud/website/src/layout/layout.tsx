import { type PropsWithChildren, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { SpinnerLoader } from "../components/spinner-loader.js";
import { wrpc } from "../utils/wrpc.js";

export const Layout = ({ children }: PropsWithChildren) => {
  try {
    const location = useLocation();

    const userQuery = wrpc["user.get"].useQuery(undefined, {
      retry: false,
      throwOnError: true,
      enabled: location.pathname !== "/",
    });

    return (
      <>
        {userQuery?.isLoading && (
          <div className="fixed inset-0 flex items-center justify-center">
            <SpinnerLoader />
          </div>
        )}
        {!userQuery?.isLoading && children}
      </>
    );
  } catch (error) {
    console.error(error);
    window.location.href = "/";
  }
};
