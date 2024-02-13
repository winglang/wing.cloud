import { BoltIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { StatusWithDot } from "../../../../../components/status-with-dot.js";
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
  onClick?: () => void;
}

export const EnvironmentDetails = ({
  owner,
  appName,
  environment,
  endpoints,
  endpointsLoading,
  onClick,
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

  const endpointsList = useMemo(() => {
    if (!endpoints || endpoints.length === 0) {
      return [];
    }

    return endpoints.slice(1);
  }, [endpoints]);

  const statusString = useStatus(environment?.status);

  return (
    <div
      className={clsx(
        "p-4 md:p-6 w-full rounded-md gap-4 md:gap-6 flex border",
        "shadow-sm",
        onClick && "hover:shadow",
        theme.bgInput,
        theme.borderInput,
        "relative",
      )}
    >
      {environment && onClick && (
        <button onClick={onClick} className="absolute inset-0 cursor-pointer" />
      )}
      <Link
        onClick={(event) => {
          if (environment?.status !== "running") {
            event.preventDefault();
          }
        }}
        to={`/${owner}/${appName}/${environment?.branch}/console`}
        className="cursor-pointer"
      >
        <div
          className={clsx(
            "rounded flex items-center justify-center cursor-pointer",
            "shrink-0 border",
            "transition-all",
            theme.borderInput,
            theme.bg3,
            environment?.status === "running" && [
              "relative z-10 shadow-sm hover:shadow ",
            ],
          )}
        >
          <ConsolePreviewIcon className="w-64 md:w-80 p-8 transition-all" />
        </div>
      </Link>

      <div className="grid grid-cols-3 flex-grow gap-4 md:gap-6 transition-all">
        <div className="flex flex-col gap-1">
          <div className={clsx("text-sm truncate", theme.text2)}>Status</div>
          {!environment && (
            <SkeletonLoader className="h-5 w-28 max-w-full" loading />
          )}
          {environment && <StatusWithDot status={environment.status} />}
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
              {!environment && <SkeletonLoader className="h-5 w-2/3" loading />}
              {environment && (
                <Link
                  className="hover:underline truncate relative z-10 flex gap-x-1"
                  onClick={(event) => {
                    if (environment.status === "stopped") {
                      event.preventDefault();
                    }
                  }}
                  to={`https://github.com/${environment.repo}/tree/${environment.branch}`}
                  target="_blank"
                >
                  <BranchIcon className={clsx("w-4 h-4", theme.text1)} />
                  <div className={clsx("font-semibold truncate", theme.text1)}>
                    {environment.branch}
                  </div>
                </Link>
              )}
              {environment && (
                <Link
                  className="hover:underline truncate relative z-10 flex gap-x-1"
                  to={`https://github.com/${environment.repo}`}
                  target="_blank"
                >
                  <GithubIcon
                    className={clsx("w-4 h-4 shrink-0", theme.text1)}
                  />
                  <div className={clsx("font-semibold truncate", theme.text1)}>
                    {environment.repo}
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {showEndpoints && (
          <div className="col-span-2 transition-all flex flex-col gap-1">
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
                    className="hover:underline truncate relative z-10 flex gap-x-1"
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
                        className={clsx("font-semibold truncate", theme.text1)}
                      >
                        {firstEndpoint.path}
                      </div>
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
                    theme.bg2Hover,
                    "transition-all",
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
                              theme.text1,
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
