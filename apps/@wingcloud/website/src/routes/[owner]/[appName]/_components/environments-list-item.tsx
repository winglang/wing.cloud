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
import { TEST_LOGS_ID } from "../[branch]/tests-page.js";

import { EnvironmentMenu } from "./environment-menu.js";

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

  const environmentRunning = useMemo(() => {
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
        "relative",
      )}
    >
      <Link
        className={clsx("absolute inset-0 rounded-md z-0", theme.focusVisible)}
        to={`/${owner}/${appName}/${environment.branch}`}
      />
      <div className="flex grow items-center justify-center gap-x-4">
        <div className="relative rounded-full p-2 bg-gray-50">
          <BranchIcon className={clsx("w-6 h-6", theme.text2, "shrink-0")} />
          <StatusDot status={status} />
        </div>

        <div className="flex gap-x-2 justify-between items-center truncate grow">
          <div className="text-xs space-y-1 truncate">
            <Link
              to={`/${owner}/${appName}/${environment.branch}`}
              className={clsx(
                "font-medium truncate relative",
                theme.text1,
                theme.text1Hover,
                "focus:underline outline-none",
                "hover:underline z-10 cursor-pointer",
              )}
            >
              {environment.prTitle}
            </Link>
            <div className="flex gap-x-2 sm:gap-x-5">
              <div
                className={clsx(
                  "truncate w-full",
                  "flex gap-x-1 items-center",
                  "leading-5 py-0.5",
                  theme.text2,
                )}
              >
                <GithubIcon className="w-3 h-3 inline-block shrink-0" />
                <Link
                  to={`https://github.com/${environment.repo}/tree/${environment.branch}`}
                  target="_blank"
                  className={clsx(
                    "font-mono truncate",
                    theme.text2,
                    theme.text2Hover,
                    "focus:underline outline-none",
                    "hover:underline z-10 cursor-pointer",
                  )}
                >
                  <div className="truncate">{environment.branch}</div>
                </Link>
                <span
                  className={clsx(
                    "truncate items-center opacity-70",
                    theme.text2,
                  )}
                >
                  updated {updatedAt}
                </span>
              </div>

              {testStatus && (
                <div>
                  <Link
                    to={`/${owner}/${appName}/${environment.branch}/#${TEST_LOGS_ID}`}
                    className={clsx(
                      "flex items-center gap-x-0.5",
                      "rounded-xl px-1 py-0.5",
                      "border",
                      theme.bg3,
                      theme.bg3Hover,
                      theme.border3,
                      "focus:underline outline-none",
                      "hover:underline z-10 cursor-pointer",
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
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-x-2 text-xs items-center justify-end">
            {!environmentRunning && (
              <div className="flex items-center gap-x-1">
                <StatusPill status={status}>
                  {status === "error" && (
                    <Link
                      to={`/${owner}/${appName}/${environment.branch}/logs`}
                      className="hover:underline z-10"
                    >
                      {status}
                    </Link>
                  )}
                </StatusPill>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-20 -ml-2">
          <EnvironmentMenu
            owner={owner}
            appName={appName}
            environment={environment}
          />
        </div>
      </div>
    </div>
  );
};
