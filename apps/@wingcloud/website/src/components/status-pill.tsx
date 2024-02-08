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
        status === "initializing" && "bg-yellow-100",
        status === "running-tests" && "bg-yellow-100",
        status === "running-server" && "bg-yellow-100",
        status === "deploying" && "bg-yellow-100",
        status === "running" && "bg-green-100",
        status === "error" && "bg-red-100",
        "rounded-xl px-2 py-0.5",
      )}
    >
      <div
        className={clsx(
          status === "initializing" && "text-yellow-600 animate-pulse",
          status === "running-tests" && "text-yellow-600 animate-pulse",
          status === "running-server" && "text-yellow-600 animate-pulse",
          status === "deploying" && "text-yellow-600 animate-pulse",
          status === "running" && "text-green-700",
          status === "error" && "text-red-600",
          "text-xs capitalize font-[500]",
        )}
      >
        {children || statusString}
      </div>
    </div>
  );
};
