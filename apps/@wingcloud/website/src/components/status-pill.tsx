import clsx from "clsx";
import { useMemo, type PropsWithChildren } from "react";

export const StatusPill = ({
  status,
  children,
}: PropsWithChildren<{ status: string }>) => {
  const statusString = useMemo(() => {
    if (status === "running-server") {
      return "Running Server";
    }
    if (status === "running-tests") {
      return "Running Tests";
    }
    if (status === "initializing" || status === "deploying") {
      return "Deploying";
    }
    return status;
  }, [status]);

  return (
    <div
      className={clsx(
        status === "initializing" &&
          "text-yellow-600 bg-yellow-100 animate-pulse",
        status === "running-tests" &&
          "text-yellow-600 bg-yellow-100 animate-pulse",
        status === "running-server" &&
          "text-yellow-600 bg-yellow-100 animate-pulse",
        status === "deploying" && "text-yellow-600 bg-yellow-100 animate-pulse",
        status === "running" && "text-green-700 bg-green-100",
        status === "error" && "text-red-600 bg-red-100",
        "text-xs rounded-xl px-2 py-0.5",
        "capitalize font-[500]",
      )}
    >
      {children || statusString}
    </div>
  );
};
