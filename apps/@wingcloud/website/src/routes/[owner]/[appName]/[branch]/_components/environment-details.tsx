import { GlobeAltIcon, BoltIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { StatusWithDot } from "../../../../../components/status-with-dot.js";
import Popover from "../../../../../design-system/popover.js";
import { SkeletonLoader } from "../../../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../../../icons/branch-icon.js";
import { CommitIcon } from "../../../../../icons/commit-icon.js";
import { ConsolePreviewIcon } from "../../../../../icons/console-preview-icon.js";
import { PullRequestIcon } from "../../../../../icons/pull-request-icon.js";
import { useStatus } from "../../../../../utils/status.js";
import { getDateTime } from "../../../../../utils/time.js";
import type { App, Endpoint, Environment } from "../../../../../utils/wrpc.js";
import { RedeployEnvironmentModal } from "../../_components/redeploy-environment-modal.js";

export interface EvironmentDetailsProps {
  loading?: boolean;
  owner: string;
  app?: App;
  environment?: Environment;
  endpoints?: Endpoint[];
  endpointsLoading?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const EnvironmentDetails = ({
  owner,
  app,
  environment,
  endpoints,
  endpointsLoading,
  onClick,
  actions,
}: EvironmentDetailsProps) => {
  const { theme } = useTheme();

  const environmentStopped = useMemo(() => {
    return (
      !endpointsLoading &&
      environment &&
      ["stopped", "error"].includes(environment.status)
    );
  }, [environment, endpointsLoading]);

  const showEndpoints = useMemo(() => {
    return (
      environment?.status === "running" &&
      (endpoints !== undefined || endpointsLoading)
    );
  }, [endpoints, endpointsLoading, environment]);

  const firstEndpoint = useMemo(() => {
    if (!endpoints || endpoints.length === 0) {
      return;
    }
    return endpoints[0];
  }, [endpoints]);

  const endpointsRemainingList = useMemo(() => {
    if (!endpoints || endpoints.length === 0) {
      return [];
    }

    return endpoints.slice(1);
  }, [endpoints]);

  const { statusString } = useStatus(environment?.status);

  const [showRestartModal, setShowRestartModal] = useState(false);

  return (
    <div
      className={clsx(
        "p-4 md:p-6 w-full rounded-md flex",
        "group",
        "gap-0 sm:gap-4 md:gap-6",
        "transition-all",
        onClick && "shadow-sm hover:shadow",
        ["border", theme.borderInput],
        theme.bgInput,
        "relative",
      )}
    >
      {environment && onClick && (
        <button
          data-testid="environment-details-button"
          onClick={onClick}
          className={clsx(
            "-m-px",
            "absolute inset-0 cursor-pointer rounded-md border",
            theme.focusVisible,
            theme.borderInput,
          )}
        />
      )}
      <Link
        to={`/${owner}/${app?.appName}/console/${environment?.branch}`}
        className={clsx(
          theme.focusVisible,
          "rounded border-0 sm:border",
          theme.borderInput,
        )}
        onClick={(event) => {
          if (environment?.status !== "running") {
            event.preventDefault();
          }
        }}
      >
        <div
          className={clsx(
            "hidden sm:flex",
            "rounded items-center justify-center",
            "shrink-0",
            "transition-all",
            theme.bg3,
            "cursor-default",
            environment?.status === "running" && [
              "hover:cursor-pointer",
              "relative z-10 shadow-sm hover:shadow",
              "cursor-pointer",
            ],
          )}
        >
          <ConsolePreviewIcon className="w-64 md:w-80 p-8 transition-all" />
        </div>
      </Link>

      <div className="flex w-full gap-4 md:gap-6 truncate">
        <div className="flex flex-col gap-4 md:gap-6 transition-all w-1/2 max-w-64 truncate">
          <div className="flex col-span-4 xl:col-span-3 flex-col gap-1">
            <div className={clsx("text-sm truncate", theme.text2)}>Status</div>
            {!environment && (
              <SkeletonLoader className="h-5 w-28 max-w-full" loading />
            )}
            <div className="flex gap-x-1 items-center">
              {environment && (
                <StatusWithDot
                  status={environment.status}
                  dataTestId="environment-status"
                />
              )}
            </div>
          </div>

          <div
            className={clsx(
              "flex flex-col gap-1",
              showEndpoints && "col-span-4 xl:col-span-3",
              !showEndpoints && "col-span-9",
            )}
          >
            <div className={clsx("text-sm truncate", theme.text2)}>Source</div>
            <div className="text-xs">
              <div className="space-y-1">
                {!environment && (
                  <SkeletonLoader className="h-5 w-2/3" loading />
                )}
                {environment && (
                  <div className="flex gap-x-1">
                    <BranchIcon className={clsx("w-4 h-4", theme.text2)} />
                    <Link
                      className={clsx(
                        "hover:underline focus:underline outline-none",
                        "font-semibold truncate",
                        theme.text1,
                        "truncate relative z-10",
                      )}
                      onClick={(event) => {
                        if (environment.status === "stopped") {
                          event.preventDefault();
                        }
                      }}
                      to={`https://github.com/${environment.repo}/tree/${environment.branch}`}
                      target="_blank"
                    >
                      {environment.branch}
                    </Link>
                  </div>
                )}

                {app?.lastCommitMessage && environment && (
                  <>
                    {environment.type === "production" && (
                      <div className="flex gap-x-1 items-center">
                        <CommitIcon
                          className={clsx("size-4 shrink-0", theme.text2)}
                        />
                        <Link
                          className={clsx(
                            "hover:underline focus:underline outline-none",
                            "truncate relative z-10",
                            "font-semibold truncate",
                            theme.text1,
                          )}
                          to={`https://github.com/${environment.repo}/commit/${app.lastCommitSha}`}
                          target="_blank"
                        >
                          {app.lastCommitMessage}
                        </Link>
                      </div>
                    )}
                    {environment.type === "preview" && (
                      <div className="flex gap-x-1 items-center">
                        <PullRequestIcon
                          className={clsx("size-4 shrink-0", theme.text2)}
                        />
                        <Link
                          className={clsx(
                            "hover:underline focus:underline outline-none",
                            "truncate relative z-10",
                            "font-semibold truncate",
                            theme.text1,
                          )}
                          to={`https://github.com/${environment.repo}/pull/${environment.prNumber}`}
                          target="_blank"
                        >
                          {environment.prTitle} #{environment.prNumber}
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:gap-6 transition-all grow truncate">
          <div className="flex col-span-4 xl:col-span-3 flex-col gap-1 truncate">
            <div className={clsx("text-sm truncate", theme.text2)}>
              Created at
            </div>
            <div
              className={clsx("text-xs font-semibold truncate", theme.text1)}
            >
              {!environment && (
                <SkeletonLoader className="h-5 w-24 max-w-full" loading />
              )}
              {environment && getDateTime(environment.createdAt)}
            </div>
          </div>

          {showEndpoints && (
            <div className="col-span-4 xl:col-span-3 transition-all flex flex-col gap-1">
              <div className={clsx("text-sm truncate", theme.text2)}>
                Endpoints
              </div>
              <div
                className={clsx(
                  "text-xs flex gap-x-2 items-center w-full",
                  theme.text3,
                )}
              >
                {environmentStopped && (
                  <div className="italic">Environment {statusString}.</div>
                )}
                {!environmentStopped && endpointsLoading && (
                  <SkeletonLoader className="h-5 w-2/3" loading />
                )}

                {firstEndpoint && (
                  <div className="flex truncate">
                    <Link
                      className={clsx(
                        "hover:underline focus:underline outline-none",
                        "truncate relative z-10 flex gap-x-1",
                      )}
                      to={firstEndpoint.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="flex gap-x-1 truncate">
                        {firstEndpoint.browserSupport ? (
                          <GlobeAltIcon className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0" />
                        ) : (
                          <BoltIcon className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                        )}
                        <div
                          className={clsx(
                            "font-semibold truncate",
                            theme.text1,
                          )}
                        >
                          {firstEndpoint.path}
                        </div>
                      </div>
                    </Link>
                  </div>
                )}

                {endpointsRemainingList.length > 0 && (
                  <Popover
                    classNames={clsx(
                      "rounded-full py-0.5 px-1.5 flex text-xs font-semibold",
                      theme.textInput,
                      "border",
                      theme.borderInput,
                      theme.focusVisible,
                      theme.bg1,
                      theme.bg2Hover,
                      "transition-all",
                    )}
                    button={`+${endpointsRemainingList.length}`}
                  >
                    <div className="flex gap-x-3">
                      <div className="space-y-0.5">
                        {endpointsRemainingList.map((endpoint) => (
                          <div
                            key={endpoint.id}
                            className="flex gap-2 items-center"
                          >
                            <Link
                              className={clsx(
                                "hover:underline focus:underline outline-none",
                                "truncate relative z-10 flex gap-x-1",
                                theme.text1,
                                "text-xs",
                              )}
                              to={endpoint.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {endpoint.browserSupport ? (
                                <GlobeAltIcon className="w-4 h-4 mr-1 text-violet-700 dark:text-violet-400" />
                              ) : (
                                <BoltIcon className="w-4 h-4 mr-1 text-amber-500 dark:text-amber-400" />
                              )}
                              {endpoint.path}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Popover>
                )}
                {endpoints?.length === 0 && !endpointsLoading && (
                  <div>No endpoints found</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end items-start xl:col-span-3">
          {actions}
        </div>
      </div>

      {app && environment && (
        <RedeployEnvironmentModal
          owner={owner}
          appName={app.appName}
          branch={environment.branch}
          show={showRestartModal}
          onClose={setShowRestartModal}
        />
      )}
    </div>
  );
};
