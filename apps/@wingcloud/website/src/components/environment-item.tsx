import clsx from "clsx";
import { useMemo } from "react";

import { GithubIcon } from "../icons/github-icon.js";
import { getTimeFromNow } from "../utils/time.js";
import type { Environment } from "../utils/wrpc.js";

const getTestStatus = (environment: Environment) => {
  if (!environment.testResults) {
    return "pending";
  }
  if (environment.testResults.data.testResults.length === 0) {
    return "";
  }
  if (
    environment.testResults.data.testResults.some(
      (testResult) => testResult.pass === false,
    )
  ) {
    return "failed";
  }
  if (
    environment.testResults.data.testResults.some(
      (testResult) => testResult.pass === true,
    )
  ) {
    return "running";
  }

  return "passed";
};

export const EnvironmentItem = ({
  environment,
}: {
  environment: Environment;
}) => {
  const status = useMemo(() => {
    return environment.status;
  }, [environment.status]);

  const testStatus = useMemo(() => {
    return getTestStatus(environment);
  }, [environment]);

  const linkEnabled = useMemo(() => {
    return environment?.url != "" && status === "running";
  }, [environment, status]);

  return (
    <div className="flex justify-between items-center truncate">
      <div className="text-xs space-y-2 truncate">
        <button
          className={clsx(
            "font-semibold truncate",
            linkEnabled && "hover:underline",
          )}
          rel="noopener noreferrer"
          disabled={!linkEnabled}
          onClick={(e) => {
            e.stopPropagation();
            window.open(environment.url, "_blank");
          }}
        >
          {environment.prTitle}
        </button>

        <div className="truncate flex gap-x-2">
          <div className="text-slate-600 font-mono flex gap-x-1 items-center">
            <GithubIcon className="w-3 h-3 inline-block" />
            <button
              className="truncate hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  `https://github.com/${environment.repo}/tree/${environment.branch}`,
                  "_blank",
                );
              }}
            >
              {environment.branch}
            </button>
          </div>
          <span className="text-slate-400 truncate">
            updated {getTimeFromNow(environment.updatedAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-4">
        <div className="flex gap-x-2 text-xs items-center">
          {testStatus && (
            <span
              className={clsx(
                testStatus === "failed" && "bg-red-200 text-red-800",
                testStatus === "passed" && "bg-green-200 text-green-800",
                ["running", "pending"].includes(testStatus) &&
                  "bg-slate-200 text-slate-600",
                "inline-block font-semibold px-2.5 py-0.5 rounded-full",
              )}
            >
              Tests {testStatus}
            </span>
          )}

          <span
            className={clsx(
              // status === "initializing" && "bg-yellow-200 text-yellow-800",
              // status === "deploying" && "bg-blue-200 text-blue-800",
              status === "running" && "bg-green-200 text-green-800",
              status !== "running" && "bg-slate-200 text-slate-600",
              "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full",
            )}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};
