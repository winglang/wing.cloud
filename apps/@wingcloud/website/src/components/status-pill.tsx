import clsx from "clsx";
import { useMemo, type PropsWithChildren } from "react";

import { useStatus } from "../utils/status.js";
import type { EnvironmentStatus } from "../utils/wrpc.js";

export const StatusPill = ({
  status,
  children,
}: PropsWithChildren<{ status: EnvironmentStatus }>) => {
  const { statusString, color } = useStatus(status);

  return (
    <div
      className={clsx(
        color === "yellow" && "bg-yellow-100",
        color === "green" && "bg-green-100",
        color === "red" && "bg-red-100",
        color === "gray" && "bg-gray-100",
        "rounded-xl px-2 py-0.5",
      )}
    >
      <div
        className={clsx(
          color === "yellow" && "text-yellow-600 animate-pulse",
          color === "green" && "text-green-700",
          color === "red" && "text-red-600",
          color === "gray" && "text-gray-600",
          "text-xs capitalize font-[500]",
        )}
      >
        {children || statusString}
      </div>
    </div>
  );
};
