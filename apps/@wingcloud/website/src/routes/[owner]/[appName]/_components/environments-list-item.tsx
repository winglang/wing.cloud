import {
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { StatusDot } from "../../../../components/status-dot.js";
import { StatusPill } from "../../../../components/status-pill.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../../icons/branch-icon.js";
import { GithubIcon } from "../../../../icons/github-icon.js";
import { useTimeAgo } from "../../../../utils/time.js";
import type { Environment } from "../../../../utils/wrpc.js";
import { DEPLOYMENT_LOGS_ID, TEST_LOGS_ID } from "../[branch]/index.js";

type ErrorStatus = "failed" | "passed";

const getTestStatus = (environment: Environment): ErrorStatus | undefined => {
  if (!environment.testResults?.testResults?.length) {
    return;
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

export interface EnvironmentsListItemProps {
  owner: string;
  appName: string;
  environment: Environment;
}

export const EnvironmentsListItem = ({
  owner,
  appName,
  environment,
}: EnvironmentsListItemProps) => {
  const { theme } = useTheme();

  const status = useMemo(() => {
    return environment.status;
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
        "rounded-md p-4 text-left w-full block",
        theme.bgInput,
        "border",
        theme.borderInput,
        "shadow-sm hover:shadow",
      )}
    >
      <div className="flex items-center gap-x-4">
        <div className="relative">
          <BranchIcon
            className={clsx(
              "w-8 h-8",
              "rounded-full border-slate-300 border",
              theme.text2,
            )}
          />
          <StatusDot status={status} />
        </div>

        <div className="flex justify-between items-center truncate grow">
          <div className="text-xs space-y-1 truncate">
            <Link
              to={`/${owner}/${appName}/${environment.branch}`}
              className={clsx(
                "font-medium truncate hover:underline",
                theme.text1,
              )}
              rel="noopener noreferrer"
            >
              {environment.prTitle}
            </Link>

            <div className="truncate flex gap-x-2 sm:gap-x-5">
              <div className={clsx("flex gap-x-1 items-center", theme.text2)}>
                <GithubIcon className="w-3 h-3 inline-block" />
                <a
                  href={`https://github.com/${environment.repo}/tree/${environment.branch}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    "truncate hover:underline items-end flex font-mono",
                    theme.text2,
                  )}
                >
                  {environment.branch}
                </a>
                <span
                  className={clsx(
                    "truncate items-center flex opacity-70",
                    theme.text2,
                  )}
                >
                  updated {updatedAt}
                </span>
              </div>

              {testStatus && (
                <Link
                  to={`/${owner}/${appName}/${environment.branch}/#${TEST_LOGS_ID}`}
                  className={clsx(
                    "flex items-end gap-x-0.5",
                    "rounded-xl px-1 py-0.5",
                    "border",
                    theme.bg3,
                    theme.bg3Hover,
                    theme.border3,
                  )}
                  title={`tests ${testStatus}`}
                >
                  <BeakerIcon className={clsx("w-4 h-4", theme.text2)} />
                  {testStatus === "passed" && (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )}
                  {testStatus === "failed" && (
                    <XCircleIcon className="w-4 h-4 text-red-500" />
                  )}
                </Link>
              )}
            </div>
          </div>

          <div className="flex gap-x-4 text-xs items-center justify-end">
            {linkEnabled && (
              <Link
                to={`/${owner}/${appName}/${environment.branch}/console`}
                className={clsx("text-xs hover:underline ", theme.text1)}
              >
                Visit Console
              </Link>
            )}
            {!linkEnabled && (
              <StatusPill status={status}>
                {status === "error" && (
                  <Link
                    to={`/${owner}/${appName}/${environment.branch}/#${DEPLOYMENT_LOGS_ID}`}
                    className="hover:underline"
                  >
                    {status}
                  </Link>
                )}
              </StatusPill>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
