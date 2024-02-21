import clsx from "clsx";

import { useTheme } from "../design-system/theme-provider.js";
import { useStatus } from "../utils/status.js";
import type { EnvironmentStatus } from "../utils/wrpc.js";

export const StatusWithDot = ({ status }: { status: EnvironmentStatus }) => {
  const { statusString, color } = useStatus(status);

  const { theme } = useTheme();

  return (
    <div className="text-xs">
      <div className="flex items-center truncate">
        <div
          title={status}
          className={clsx(
            "w-2.5 h-2.5",
            "rounded-full shrink-0",
            color === "gray" && "bg-gray-300 animate-pulse",
            color === "yellow" && "bg-yellow-300 animate-pulse",
            color === "green" && "bg-green-300",
            color === "red" && "bg-red-300",
          )}
        />
        <div
          className={clsx(
            "rounded-xl px-2 py-0.5 capitalize truncate font-semibold",
            theme.text2,
          )}
        >
          {statusString}
        </div>
      </div>
    </div>
  );
};
