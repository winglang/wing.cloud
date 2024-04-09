import clsx from "clsx";

import { useTheme } from "../design-system/theme-provider.js";
import { useStatus } from "../utils/status.js";
import type { EnvironmentStatus } from "../utils/wrpc.js";

export const StatusWithDot = ({
  status,
  dataTestId,
}: {
  status: EnvironmentStatus;
  dataTestId?: string;
}) => {
  const { statusString, color } = useStatus(status);

  const { theme } = useTheme();

  return (
    <div className="flex items-center truncate gap-x-1">
      <div className="size-4 items-center flex justify-center">
        <div
          title={status}
          className={clsx(
            "w-2.5 h-2.5",
            "rounded-full shrink-0",
            color === "yellow" && "bg-yellow-300 animate-pulse",
            color === "green" && "bg-green-300",
            color === "red" && "bg-red-300",
            color === "gray" && "bg-gray-300",
          )}
        />
      </div>
      <div
        data-testid={dataTestId}
        className={clsx(
          "py-0.5 capitalize truncate font-semibold",
          theme.text1,
        )}
      >
        {statusString}
      </div>
    </div>
  );
};
