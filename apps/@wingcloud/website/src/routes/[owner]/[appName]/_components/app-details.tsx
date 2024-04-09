import { GlobeAltIcon, BoltIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { StatusWithDot } from "../../../../components/status-with-dot.js";
import Popover from "../../../../design-system/popover.js";
import { SkeletonLoader } from "../../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../../icons/branch-icon.js";
import { CommitIcon } from "../../../../icons/commit-icon.js";
import { PullRequestIcon } from "../../../../icons/pull-request-icon.js";
import { useStatus } from "../../../../utils/status.js";
import { getDateTime } from "../../../../utils/time.js";
import type { App, Environment, Endpoint } from "../../../../utils/wrpc.js";

import { EnvironmentMenu } from "./environment-menu.js";
import { RedeployEnvironmentModal } from "./redeploy-environment-modal.js";

export interface AppDetailsProps {
  loading?: boolean;
  owner: string;
  app?: App;
  environment?: Environment;
  endpoints?: Endpoint[];
  endpointsLoading?: boolean;
}

export const AppDetails = ({
  owner,
  app,
  environment,
  endpoints,
  endpointsLoading,
}: AppDetailsProps) => {
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
        "p-6 w-full rounded-md",
        "transition-all",
        ["border", theme.borderInput],
        theme.bgInput,
        "flex flex-col",
      )}
    >
      <div className="space-y-1 flex relative pb-4">
        <div className="grow">
          {app && (
            <Link
              data-testid="app-details-link"
              aria-disabled={!environment}
              className={clsx(
                "absolute inset-0 peer",
                "border-b border-gray-100 hover:border-gray-200",
                "w-full transition-all",
              )}
              to={`/${owner}/${app?.appName}/environment/${app.defaultBranch}`}
              onClick={(event) => {
                if (!environment) {
                  event.preventDefault();
                }
              }}
            />
          )}
          <div
            className={clsx(
              "text-base font-semibold leading-7",
              "peer-hover:underline focus:underline outline-none",
              "font-semibold truncate",
              "transition-all",
              theme.textInput,
              "flex items-center gap-x-1",
            )}
          >
            {app && `${app.appName} / ${app.defaultBranch}`}
          </div>

          {app?.description && (
            <p
              className={clsx(
                "max-w-2xl text-sm leading-6 truncate",
                theme.text3,
              )}
              title={app?.description || "No description"}
            >
              {app.description}
            </p>
          )}
        </div>
        <div className="flex justify-end items-start xl:col-span-3">
          {environment && app?.appName && (
            <EnvironmentMenu
              owner={owner}
              appName={app?.appName}
              environment={environment}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="py-4 sm:col-span-1">
          <div className="flex flex-col gap-1">
            <div className={clsx("text-sm truncate", theme.textInput)}>
              Status
            </div>
            {!environment && (
              <SkeletonLoader className="h-5 w-28 max-w-full" loading />
            )}
            <div className="flex gap-x-1 items-center text-xs">
              {environment && (
                <StatusWithDot
                  status={environment.status}
                  dataTestId="environment-status"
                />
              )}
            </div>
          </div>
        </div>
        <div className="border-t sm:border-none border-gray-100 py-4 sm:col-span-1">
          <div className="flex flex-col gap-1 truncate">
            <div className={clsx("text-sm truncate", theme.textInput)}>
              Deployed at
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
        </div>
        <div className="border-t border-gray-100 py-4 sm:col-span-1">
          <div className={clsx("flex flex-col gap-1")}>
            <div className={clsx("text-sm truncate", theme.textInput)}>
              Source
            </div>
            <div className="text-xs">
              <div className="space-y-1">
                {!environment && (
                  <SkeletonLoader className="h-5 w-2/3" loading />
                )}
                {environment && (
                  <div className="flex gap-x-1">
                    <BranchIcon className={clsx("w-4 h-4", theme.text1)} />
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
                          className={clsx("size-4 shrink-0", theme.textInput)}
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
                          className={clsx("size-4 shrink-0", theme.textInput)}
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
        {showEndpoints && (
          <div className="border-t border-gray-100 pt-4 sm:py-4 sm:col-span-1">
            <div className="transition-all flex flex-col gap-1">
              <div className={clsx("text-sm truncate", theme.textInput)}>
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
          </div>
        )}
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
