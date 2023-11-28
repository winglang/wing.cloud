import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

import { Button } from "../design-system/button.js";

const FallbackComponent = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => {
  return (
    <div
      className={clsx(
        "text-center",
        "w-full flex-grow overflow-auto",
        "max-w-5xl mx-auto py-4 px-4 sm:px-6 sm:py-6",
        "space-y-4",
      )}
    >
      <div className="text-2xl font-bold">Something went wrong</div>
      <div className="text-sm text-gray-500">
        {error.message || error.toString()}
      </div>
      <div className="mt-4">
        <Button onClick={resetErrorBoundary}>Try again</Button>
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
