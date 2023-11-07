import clsx from "clsx";

import { getTimeFromNow } from "../utils/time.js";
import type { Environment } from "../utils/wrpc.js";

export const EnvironmentItem = ({
  environment,
}: {
  environment: Environment;
}) => {
  const status = environment.status;
  const testStatus = environment.testResults?.status;

  return (
    <div className="flex justify-between items-center truncate">
      <div className="text-xs">
        {(environment.url && status === "running" && (
          <button
            className="hover:underline font-semibold truncate"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              window.open(environment.url, "_blank");
            }}
          >
            {environment.branch}
          </button>
        )) || (
          <div className="font-semibold truncate">{environment.branch}</div>
        )}

        <div className="text-slate-500 text-[10px] truncate">
          updated {getTimeFromNow(environment.updatedAt)}
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-4">
        {testStatus && (
          <span
            className={clsx(
              // testStatus === "initializing" && "bg-yellow-200 text-yellow-800",
              // testStatus === "deploying" && "bg-blue-200 text-blue-800",
              testStatus === "running" && "bg-green-200 text-green-800",
              testStatus !== "running" && "bg-slate-200 text-slate-800",
              "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full",
            )}
          >
            {testStatus}
          </span>
        )}
        <span
          className={clsx(
            // status === "initializing" && "bg-yellow-200 text-yellow-800",
            // status === "deploying" && "bg-blue-200 text-blue-800",
            status === "running" && "bg-green-200 text-green-800",
            status !== "running" && "bg-slate-200 text-slate-800",
            "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full",
          )}
        >
          {status}
        </span>
      </div>
    </div>
  );
};
