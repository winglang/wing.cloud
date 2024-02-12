import { BoltIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../../../design-system/button.js";
import Popover from "../../../../../design-system/popover.js";
import { SkeletonLoader } from "../../../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../../../icons/branch-icon.js";
import { ConsolePreviewIcon } from "../../../../../icons/console-preview-icon.js";
import { GithubIcon } from "../../../../../icons/github-icon.js";
import { useStatus } from "../../../../../utils/status.js";
import { getDateTime } from "../../../../../utils/time.js";
import type { Endpoint, Environment } from "../../../../../utils/wrpc.js";

export interface EvironmentDetailsProps {
  loading?: boolean;
  owner: string;
  appName: string;
  environment?: Environment;
  endpoints?: Endpoint[];
  endpointsLoading?: boolean;
}

export const EnvironmentDetails = ({
  owner,
  appName,
  environment,
  endpoints,
  endpointsLoading,
}: EvironmentDetailsProps) => {
  const { theme } = useTheme();

  const environmentStopped = useMemo(() => {
    return environment && ["stopped", "error"].includes(environment.status);
  }, [environment]);

  const showEndpoints = useMemo(() => {
    return endpoints !== undefined || endpointsLoading;
  }, [endpoints, endpointsLoading]);

  const deployingEndpoints = useMemo(() => {
    return (
      environment &&
      ["initializing", "running-server", "running-tests", "deploying"].includes(
        environment.status,
      )
    );
  }, [endpointsLoading, environment]);

  const firstEndpoint = useMemo(() => {
    if (!endpoints || endpoints.length === 0 || deployingEndpoints) {
      return;
    }
    return endpoints[0];
  }, [endpoints]);

  const endpointsList = useMemo(() => {
    if (!endpoints || endpoints.length === 0 || deployingEndpoints) {
      return [];
    }

    return endpoints.slice(1);
  }, [endpoints]);

  const statusString = useStatus(environment?.status);

  return (
    <div
      className={clsx(
        "p-4 sm:p-6 w-full rounded-md gap-4 sm:gap-6 flex border",
        "shadow-sm",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      <div
        className={clsx(
          "rounded flex items-center justify-center cursor-pointer",
          "shrink-0 border",
          "shadow-sm hover:shadow-md",
          theme.borderInput,
          theme.bg3,
        )}
      >
        <ConsolePreviewIcon className="w-60 lg:w-80 p-4 lg:p-8 transition-all" />
      </div>

      <div className="grid grid-cols-3 flex-grow gap-4 md:gap-6 transition-all">
        <div className="flex flex-col gap-1">
          <div className={clsx("text-sm truncate", theme.text2)}>Status</div>
          {!environment && (
            <SkeletonLoader className="h-5 w-28 max-w-full" loading />
          )}
          {environment && (
            <div className="text-xs">
              <div className="flex items-center truncate">
                <div
                  title={environment?.status}
                  className={clsx(
                    "w-2.5 h-2.5",
                    "rounded-full shrink-0",
                    environment.status === "initializing" &&
                      "bg-yellow-300 animate-pulse",
                    environment.status === "running-server" &&
                      "bg-yellow-300 animate-pulse",
                    environment.status === "running-tests" &&
                      "bg-yellow-300 animate-pulse",
                    environment.status === "deploying" &&
                      "bg-yellow-300 animate-pulse",
                    environment.status === "running" && "bg-green-300",
                    environment.status === "error" && "bg-red-300",
                    environment.status === "stopped" && "bg-slate-400",
                  )}
                />
                <div
                  className={clsx(
                    "rounded-xl px-2 py-0.5 capitalize truncate font-semibold",
                    theme.text1,
                  )}
                >
                  {statusString}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className={clsx("text-sm truncate", theme.text2)}>
            Created at
          </div>
          <div className={clsx("text-xs font-semibold truncate", theme.text1)}>
            {!environment && (
              <SkeletonLoader className="h-5 w-24 max-w-full" loading />
            )}
            {environment && getDateTime(environment.createdAt)}
          </div>
        </div>

        <div className="flex justify-end items-start">
          <Link
            to={`/${owner}/${appName}/${environment?.branch}/console`}
            className="z-10"
          >
            <Button disabled={environment?.status !== "running"}>
              Console
            </Button>
          </Link>
        </div>

        <div
          className={clsx(
            "flex flex-col gap-1",
            !showEndpoints && "col-span-2",
          )}
        >
          <div className={clsx("text-sm truncate", theme.text2)}>Source</div>
          <div className="text-xs">
            <div className="space-y-1">
              <div>
                {!environment && (
                  <SkeletonLoader className="h-5 w-2/3" loading />
                )}
                {environment && (
                  <Link
                    className="hover:underline truncate z-10"
                    aria-disabled={environment.status === "stopped"}
                    to={`https://github.com/${environment.repo}/tree/${environment.branch}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex gap-x-2">
                      <BranchIcon className={clsx("w-4 h-4", theme.text1)} />
                      <div
                        className={clsx("font-semibold truncate", theme.text1)}
                      >
                        {environment.branch}
                      </div>
                    </div>
                  </Link>
                )}
              </div>
              <div>
                {environment && (
                  <Link
                    className="hover:underline truncate z-10"
                    to={`https://github.com/${environment.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex gap-x-2">
                      <GithubIcon className={clsx("w-4 h-4", theme.text1)} />
                      <div
                        className={clsx("font-semibold truncate", theme.text1)}
                      >
                        {environment.repo}
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {showEndpoints && (
          <div className="col-span-2 transition-all flex flex-col gap-1">
            <div className={clsx("text-sm truncate", theme.text2)}>
              Endpoints
            </div>
            <div className="text-xs flex gap-x-2 items-center w-full">
              {endpointsLoading && (
                <SkeletonLoader className="h-5 w-2/3" loading />
              )}
              {deployingEndpoints && (
                <div className={clsx(theme.text3, "italic")}>Deploying...</div>
              )}
              {environmentStopped && (
                <div className={clsx(theme.text3, "italic")}>
                  Environment {statusString}.
                </div>
              )}

              {firstEndpoint && (
                <div className="flex truncate">
                  <Link
                    className={clsx(
                      "hover:underline truncate relative z-10 flex gap-x-1",
                      theme.text3,
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
                      <div className="truncate">{firstEndpoint.path}</div>
                    </div>
                  </Link>
                </div>
              )}

              {endpointsList.length > 1 && (
                <Popover
                  classNames={clsx(
                    "rounded-full py-0.5 px-1.5 flex text-xs font-semibold",
                    theme.textInput,
                    "border",
                    theme.borderInput,
                    theme.focusInput,
                    theme.bg1,
                  )}
                  button={`+${endpointsList.length}`}
                >
                  <div className="flex gap-x-3">
                    <div className="space-y-0.5">
                      {endpointsList.map((endpoint) => (
                        <div
                          key={endpoint.id}
                          className="flex gap-2 items-center"
                        >
                          <Link
                            className={clsx(
                              "hover:underline truncate relative z-10 flex gap-x-1",
                              theme.text3,
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
