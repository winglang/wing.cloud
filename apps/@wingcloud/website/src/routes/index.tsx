import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { GithubLogin } from "../components/github-login.js";
import { Button } from "../design-system/button.js";
import { Modal } from "../design-system/modal.js";
import { wrpc } from "../utils/wrpc.js";

export const Component = () => {
  const navigate = useNavigate();

  const user = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
  });

  const showModal = useMemo(() => {
    return user.error !== null;
  }, [user.error]);

  return (
    <>
      {location.pathname === "/" && <GithubLogin />}
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
                    Ups...
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Please sign in to access this page.
                    </p>
                  </div>
                </div>
              </div>
              <div className="sm:flex sm:flex-row-reverse">
                <Button onClick={() => navigate("/")}>Back to home</Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </>
  );
};
