import {
  ArrowTopRightOnSquareIcon,
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { BranchIcon } from "../icons/branch-icon.js";
import { GithubIcon } from "../icons/github-icon.js";
import { useTimeAgo } from "../utils/time.js";
import type { Environment } from "../utils/wrpc.js";

type Status = "initializing" | "tests" | "deploying" | "running" | "failed";

const getTestStatus = (environment: Environment) => {
  if (!environment.testResults?.testResults?.length) {
    return "";
  }
  if (
    environment.testResults.testResults.some(
      (testResult) => testResult.pass === false,
    )
  ) {
    return "failed";
  }
  return "passed";
};

export const EnvironmentsListItem = ({
  appName,
  environment,
}: {
  appName: string;
  environment: Environment;
}) => {
  const status = useMemo(() => {
    return environment.status as Status;
  }, [environment.status]);

  const testStatus = useMemo(() => {
    return getTestStatus(environment);
  }, [environment]);

  const linkEnabled = useMemo(() => {
    return environment?.url != "" && status === "running";
  }, [environment, status]);

  const updatedAt = useTimeAgo(environment.updatedAt);

  return (
    <div
      className={clsx(
        "bg-white rounded p-4 text-left w-full block",
        "shadow hover:shadow-md transition-all",
      )}
    >
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
              status === "initializing" && "bg-slate-400 animate-pulse",
              status === "deploying" && "bg-yellow-300 animate-pulse",
              status === "running" && "bg-green-300",
              status === "failed" && "bg-red-300",
            )}
          />
        </div>

        <div className="flex justify-between items-center truncate grow">
          <div className="text-xs space-y-2 truncate">
            <Link
              to={`/apps/${appName}/${environment.id}`}
              className="font-semibold truncate hover:underline text-slate-700"
              rel="noopener noreferrer"
            >
              {environment.prTitle}
            </Link>

            <div className="truncate flex gap-x-5">
              <div className="text-slate-600 flex gap-x-1 items-center">
                <GithubIcon className="w-3 h-3 inline-block" />
                <a
                  href={`https://github.com/${environment.repo}/tree/${environment.branch}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:underline items-end flex font-mono"
                >
                  {environment.branch}
                </a>
                <span className="text-slate-400 truncate items-center flex">
                  updated {updatedAt}
                </span>
              </div>

              {["passed", "failed"].includes(testStatus) && (
                <div
                  className={clsx(
                    "flex items-end gap-x-0.5",
                    "rounded-xl bg-slate-100 px-1 py-0.5",
                    "border border-slate-200",
                  )}
                  title={`tests ${testStatus}`}
                >
                  <BeakerIcon className="w-4 h-4 text-slate-500" />
                  {testStatus === "passed" && (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )}
                  {testStatus === "failed" && (
                    <XCircleIcon className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-x-4 text-xs items-center justify-end">
            {linkEnabled && (
              <a
                href={environment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline text-slate-600"
              >
                View Preview
              </a>
            )}
            {!linkEnabled && (
              <div
                className={clsx(
                  status === "initializing" && "text-slate-600 bg-slate-100",
                  status === "tests" && "text-yellow-600 bg-yellow-100",
                  status === "deploying" && "text-yellow-600 bg-yellow-100",
                  status === "failed" && "text-red-600 bg-red-100",
                  "text-xs rounded-xl px-2 py-0.5",
                  "capitalize font-[500]",
                )}
              >
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
