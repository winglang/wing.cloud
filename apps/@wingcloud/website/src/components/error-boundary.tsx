import { XCircleIcon } from "@heroicons/react/24/outline";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@wingcloud/wrpc";
import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

import { ErrorPage } from "./error-page.js";

const FallbackComponent = ({ error }: { error: Error }) => {
  console.log("FallbackComponent", error);
  const errorData = useMemo(() => {
    if (error instanceof UnauthorizedError) {
      return {
        code: 401,
        title: "Unauthorized",
        message: "Sorry, you need to sign in to access this page.",
      };
    } else if (error instanceof ForbiddenError) {
      return {
        code: 403,
        title: "Forbidden",
        message: "Sorry, you don't have permission to access this page.",
      };
    } else if (error instanceof NotFoundError) {
      return {
        code: 404,
        title: "Not found",
        message:
          error.message ||
          "Sorry, we couldn’t find the page you’re looking for.",
      };
    } else {
      return {
        code: 500,
        title: "Error",
        message: error.message,
      };
    }
  }, [error]);

  return (
    <ErrorPage
      title={errorData.title}
      code={errorData.code}
      message={errorData.message}
    />
  );
};

export const ErrorBoundary = ({ children }: PropsWithChildren) => {
  return (
    <ReactErrorBoundary FallbackComponent={FallbackComponent}>
      {children}
    </ReactErrorBoundary>
  );
};
