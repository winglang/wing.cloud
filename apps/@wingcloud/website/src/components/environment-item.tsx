import clsx from "clsx";
import { useMemo } from "react";

import { BranchIcon } from "../icons/branch-icon.js";
import { GithubIcon } from "../icons/github-icon.js";
import { getTimeFromNow } from "../utils/time.js";
import type { Environment } from "../utils/wrpc.js";

const getTestStatus = (environment: Environment) => {
  if (!environment.testResults?.data?.testResults?.length) {
    return "";
  }
  if (
    environment.testResults.data.testResults.some(
      (testResult) => testResult.pass === false,
    )
  ) {
    return "failed";
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
    <div className="flex items-center gap-x-4">
      <div className="relative">
        <BranchIcon
          className={clsx(
            "w-8 h-8 text-slate-500",
            "rounded-full border-slate-300 border",
          )}
        />
        <div
          title={status}
          className={clsx(
            "absolute -top-1.5 -right-1.5",
            "w-2.5 h-2.5",
            "rounded-full",
            status !== "running" && "bg-slate-400 animate-pulse",
            status === "running" && "bg-green-300",
          )}
        />
      </div>

      <div className="flex justify-between items-center truncate grow">
        <div className="text-xs space-y-2 truncate">
          <button
            className={clsx(
              "font-semibold truncate",
              linkEnabled && "hover:underline",
            )}
            rel="noopener noreferrer"
            disabled={!linkEnabled}
            onClick={(e) => {
              e.preventDefault();
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

        <div className="flex gap-x-4 text-xs items-center justify-end">
          {testStatus && (
            <span
              className={clsx(
                testStatus === "failed" && "bg-red-200 text-red-800",
                testStatus === "passed" && "bg-green-200 text-green-800",
                "inline-block font-semibold px-2.5 py-0.5 rounded-full",
              )}
            >
              Tests {testStatus}
            </span>
          )}

          <span
            className={clsx(
              status === "running" && "hidden",
              "bg-slate-200 text-slate-600",
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
