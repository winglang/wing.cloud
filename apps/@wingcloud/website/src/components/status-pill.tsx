import clsx from "clsx";
import type { PropsWithChildren } from "react";

export const StatusPill = ({
  status,
  children,
}: PropsWithChildren<{ status: string }>) => {
  return (
    <div
      className={clsx(
        status === "initializing" && "text-yellow-600 bg-yellow-100",
        status === "running-tests" && "text-yellow-600 bg-yellow-100",
        status === "running-server" && "text-yellow-600 bg-yellow-100",
        status === "deploying" && "text-yellow-600 bg-yellow-100",
        status === "running" && "text-green-700 bg-green-100",
        status === "error" && "text-red-600 bg-red-100",
        "text-xs rounded-xl px-2 py-0.5",
        "capitalize font-[500]",
      )}
    >
      {children || status}
    </div>
  );
};
