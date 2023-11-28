import { XCircleIcon } from "@heroicons/react/24/outline";
import { ForbiddenError, UnauthorizedError } from "@wingcloud/wrpc";
import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { Link } from "react-router-dom";

import { Button } from "../design-system/button.js";
import { useTheme } from "../design-system/theme-provider.js";

type ErrorType = "Forbidden" | "Unauthorized" | "Error";

const FallbackComponent = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => {
  const { theme } = useTheme();

  const errorType = useMemo(() => {
    if (error instanceof ForbiddenError) {
      return "Forbidden";
    } else if (error instanceof UnauthorizedError) {
      return "Unauthorized";
    } else {
      return "Error";
    }
  }, [error]) as ErrorType;

  return (
    <div
      className={clsx(
        "w-full flex-grow overflow-auto",
        "max-w-xl mx-auto p-4 sm:p-6",
      )}
    >
      <div className="rounded-md bg-red-100 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {errorType === "Forbidden" && "Oops... Access Forbidden"}
              {errorType === "Unauthorized" && "Oops... Unauthorized"}
              {errorType === "Error" && "Oops... Something went wrong"}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <div className="space-y-2">
                <div className={clsx(theme.text1)}>
                  {errorType === "Forbidden" &&
                    "You don't have permission to access this page."}

                  {errorType === "Unauthorized" &&
                    "Looks like you need to sign in to see this."}

                  {(errorType === "Error" && error.message) ??
                    "An unknown error occurred."}
                </div>
                <Link
                  className={clsx(theme.text2, "block hover:underline")}
                  to="/dashboard"
                >
                  Go back to home.
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ErrorBoundary = ({ children }: PropsWithChildren) => {
  return (
    <ReactErrorBoundary FallbackComponent={FallbackComponent}>
      {children}
    </ReactErrorBoundary>
  );
};
