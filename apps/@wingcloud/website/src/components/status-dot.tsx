import clsx from "clsx";

import { useStatus } from "../utils/status.js";
import type { EnvironmentStatus } from "../utils/wrpc.js";

export const StatusDot = ({ status }: { status: EnvironmentStatus }) => {
  const { color } = useStatus(status);

  return (
    <div
      title={status}
      className={clsx(
        "absolute -top-1.5 -right-1.5",
        "w-2.5 h-2.5",
        "rounded-full",
        color === "yellow" && "bg-yellow-300 animate-pulse",
        color === "green" && "bg-green-300",
        color === "red" && "bg-red-300",
        color === "gray" && "bg-gray-300",
      )}
    />
  );
};
