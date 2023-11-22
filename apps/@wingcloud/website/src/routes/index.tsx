import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";
import { Modal } from "../design-system/modal.js";
import { Layout } from "../layout/layout.js";
import { wrpc } from "../utils/wrpc.js";

// TODO: Use state to prevent man-in-the-middle attacks.
const GITHUB_APP_CLIENT_ID = import.meta.env.VITE_GITHUB_APP_CLIENT_ID;

const AUTHORIZE_URL = (() => {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.append("client_id", GITHUB_APP_CLIENT_ID);
  return url.toString();
})();

export const Component = () => {
  const location = useLocation();

  const authCheck = wrpc["auth.check"].useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (authCheck.isError && location.pathname !== "/apps") {
      window.location.href = "/";
    }
  }, [authCheck.isError, location.pathname]);

  return (
    <Layout>
      <Outlet />

      <Modal show={authCheck.isError} onClose={() => {}}>
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <ExclamationTriangleIcon
              className="h-6 w-6 text-red-600"
              aria-hidden="true"
            />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <Dialog.Title
              as="h3"
              className="text-base font-semibold leading-6 text-gray-900"
            >
              Unauthorized
            </Dialog.Title>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                You are currently signed out.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <a
            href={AUTHORIZE_URL}
            className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          >
            <span className="flex items-center space-x-1">
              <span>Sign In</span>
              <span className="text-gray-900">
                <svg
                  height="24"
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  version="1.1"
                  width="32"
                >
                  <path
                    fill="currentColor"
                    d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
                  ></path>
                </svg>
              </span>
            </span>
          </a>
        </div>
      </Modal>
    </Layout>
  );
};
