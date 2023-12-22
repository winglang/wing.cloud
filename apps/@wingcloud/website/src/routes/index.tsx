import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";
import { Button } from "../design-system/button.js";
import { Modal } from "../design-system/modal.js";
import { wrpc } from "../utils/wrpc.js";

export const Component = () => {
  const navigate = useNavigate();

  // TODO: Use state to prevent man-in-the-middle attacks.
  const GITHUB_APP_CLIENT_ID = import.meta.env.VITE_GITHUB_APP_CLIENT_ID;

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

  const user = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
  });

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user.error !== null) {
      setShowModal(true);
    }
  }, [user.error]);

  return (
    <>
      {location.pathname === "/" && <GithubLogin url={AUTHORIZE_URL} />}
      {location.pathname !== "/" && (
        <>
          <Outlet />
          <Modal show={showModal}>
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
                <Button
                  primary
                  onClick={() => {
                    location.href = AUTHORIZE_URL;
                  }}
                >
                  Sign In
                </Button>
                <Button onClick={() => navigate("/")}>Home</Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </>
  );
};
