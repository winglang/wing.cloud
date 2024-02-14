import clsx from "clsx";
import { useMemo, type PropsWithChildren } from "react";

import { useTheme } from "../design-system/theme-provider.js";
import { useStatus } from "../utils/status.js";
import type { EnvironmentStatus } from "../utils/wrpc.js";

export const StatusWithDot = ({
  status,
  children,
}: PropsWithChildren<{ status: EnvironmentStatus }>) => {
  const statusString = useStatus(status);

  const { theme } = useTheme();

  return (
    <div className="text-xs">
      <div className="flex items-center truncate">
        <div
          title={status}
          className={clsx(
            "w-2.5 h-2.5",
            "rounded-full shrink-0",
            status === "initializing" && "bg-yellow-300 animate-pulse",
            status === "running-server" && "bg-yellow-300 animate-pulse",
            status === "running-tests" && "bg-yellow-300 animate-pulse",
            status === "deploying" && "bg-yellow-300 animate-pulse",
            status === "running" && "bg-green-300",
            status === "error" && "bg-red-300",
            status === "stopped" && "bg-slate-400",
          )}
        />
        <div
          className={clsx(
            "rounded-xl px-2 py-0.5 capitalize truncate font-semibold",
            theme.text1,
          )}
        >
          {statusString}
        </div>
      </div>
    </div>
  );
};
