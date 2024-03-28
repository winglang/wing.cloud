import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useContext, useEffect, useState } from "react";
import { useMemo } from "react";
import { Outlet } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";
import { AuthDataProviderContext } from "../data-store/auth-data-provider.js";
import { Modal } from "../design-system/modal.js";
import { useTheme } from "../design-system/theme-provider.js";

export const Component = () => {
  // TODO: Use state to prevent man-in-the-middle attacks.
  const { GITHUB_APP_CLIENT_ID } = wing.env;
  const { theme } = useTheme();

  const HOME_URL = useMemo(() => {
    const url = new URL(location.href);
    url.pathname = "";
    return url.toString();
  }, [location.href]);

  const AUTHORIZE_URL = (() => {
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.append("client_id", GITHUB_APP_CLIENT_ID);
    if (import.meta.env.DEV) {
      url.searchParams.append(
        "redirect_uri",
        "http://localhost:3900/wrpc/github.callback",
      );
    }
    return url.toString();
  })();

  const { error } = useContext(AuthDataProviderContext);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (error) {
      setShowModal(true);
    }
  }, [error]);

  return (
    <>
      {location.pathname === "/" && <GithubLogin url={AUTHORIZE_URL} />}
      {location.pathname !== "/" && (
        <>
          <Outlet />
          <Modal show={showModal} backdropBlur>
            <div className="space-y-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon
                    className="h-6 w-6 text-red-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Sign In Required
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You are signed out. Please, sign in to access this page.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-row-reverse gap-2">
                <a
                  href={AUTHORIZE_URL}
                  className={clsx(
                    "whitespace-nowrap",
                    "inline-flex gap-2 items-center text-xs font-medium outline-none rounded-md",
                    theme.focusVisible,
                    "text-white",
                    "bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600 border-sky-700 ",
                    "px-2.5 py-2",
                    "border shadow-sm",
                  )}
                >
                  Sign In
                </a>
                <a
                  href={HOME_URL}
                  className={clsx(
                    "whitespace-nowrap",
                    "inline-flex gap-2 items-center text-xs font-medium outline-none rounded-md",
                    theme.focusVisible,
                    theme.bgInput,
                    theme.bgInputHover,
                    theme.textInput,
                    "px-2.5 py-2",
                    "border shadow-sm",
                  )}
                >
                  Home
                </a>
              </div>
            </div>
          </Modal>
        </>
      )}
    </>
  );
};
