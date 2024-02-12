import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../../../design-system/button.js";
import { useNotifications } from "../../../../../design-system/notification.js";
import Popover from "../../../../../design-system/popover.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../../../icons/branch-icon.js";
import { ConsolePreviewIcon } from "../../../../../icons/console-preview-icon.js";
import { GithubIcon } from "../../../../../icons/github-icon.js";
import { getDateTime } from "../../../../../utils/time.js";
import type { Endpoint, Environment } from "../../../../../utils/wrpc.js";

import { InfoItem } from "./info-item.js";

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
  loading,
  environment,
  endpoints,
  endpointsLoading,
}: EvironmentDetailsProps) => {
  const { theme } = useTheme();
  const { showNotification } = useNotifications();

  const firstEndpoint = useMemo(() => {
    return endpoints?.[0];
  }, [endpoints]);
  const endpointsList = useMemo(() => {
    return endpoints?.slice(1) || [];
  }, [endpoints]);

  const statusString = useMemo(() => {
    if (environment?.status === "running-server") {
      return "Starting";
    }
    if (environment?.status === "running-tests") {
      return "Running Tests";
    }
    if (
      environment?.status === "initializing" ||
      environment?.status === "deploying"
    ) {
      return "Deploying";
    }
    return environment?.status;
  }, [environment?.status]);

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
          "w-60 h-40 p-4 md:p-8 shrink-0",
          "border",
          "shadow-sm hover:shadow-md",
          theme.borderInput,
          theme.bg3,
        )}
      >
        <ConsolePreviewIcon />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 flex-grow gap-4 sm:gap-6 transition-all">
        <InfoItem
          label="Status"
          loading={loading}
          value={
            <div className="flex items-center truncate">
              <div
                title={environment?.status}
                className={clsx(
                  "w-2.5 h-2.5",
                  "rounded-full shrink-0",
                  environment?.status === "initializing" &&
                    "bg-yellow-300 animate-pulse",
                  environment?.status === "running-server" &&
                    "bg-yellow-300 animate-pulse",
                  environment?.status === "running-tests" &&
                    "bg-yellow-300 animate-pulse",
                  environment?.status === "deploying" &&
                    "bg-yellow-300 animate-pulse",
                  environment?.status === "running" && "bg-green-300",
                  environment?.status === "error" && "bg-red-300",
                  environment?.status === "stopped" && "bg-slate-400",
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
          }
        />
        <InfoItem
          label="Created at"
          loading={loading}
          value={
            <div className={clsx("font-semibold truncate", theme.text1)}>
              {environment && getDateTime(environment?.createdAt)}
            </div>
          }
        />

        <InfoItem
          label="Source"
          loading={loading}
          value={
            <div className="space-y-1">
              <div>
                <Link
                  className="hover:underline truncate z-10"
                  to={`https://github.com/${environment?.repo}/tree/${environment?.branch}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex gap-x-2">
                    <BranchIcon className={clsx("w-4 h-4", theme.text1)} />
                    <div
                      className={clsx("font-semibold truncate", theme.text1)}
                    >
                      {environment?.branch}
                    </div>
                  </div>
                </Link>
              </div>
              <div>
                <Link
                  className="hover:underline truncate z-10"
                  to={`https://github.com/${environment?.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex gap-x-2">
                    <GithubIcon className={clsx("w-4 h-4", theme.text1)} />
                    <div
                      className={clsx("font-semibold truncate", theme.text1)}
                    >
                      Repository
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          }
        />

        {(endpoints !== undefined || endpointsLoading || loading) && (
          <div className="transition-all truncate">
            <InfoItem
              label="Endpoints"
              loading={endpointsLoading || loading}
              value={
                <div className="flex gap-x-2 items-center">
                  {endpoints?.length === 0 && (
                    <div className={clsx("font-normal", theme.text2)}>
                      No endpoints found.
                    </div>
                  )}

                  {firstEndpoint && (
                    <Link
                      className={clsx(
                        "hover:underline truncate relative z-10 flex gap-x-1",
                        theme.text3,
                      )}
                      to={firstEndpoint.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="truncate">{firstEndpoint.path}</div>
                    </Link>
                  )}
                  {endpointsList.length > 1 && (
                    <Popover
                      button={
                        <div
                          className={clsx(
                            "rounded-full py-0.5 px-1.5 flex text-xs font-semibold",
                            theme.text1,
                            theme.bg1,
                          )}
                        >
                          {`+${endpointsList.length}`}
                        </div>
                      }
                    >
                      <div className="flex gap-x-3">
                        <div className="space-y-0.5">
                          {endpointsList.map((endpoint) => (
                            <div
                              key={endpoint.id}
                              className="flex gap-2 items-center"
                            >
                              <DocumentDuplicateIcon
                                className={clsx(
                                  "cursor-pointer",
                                  "w-4 h-4",
                                  theme.text1,
                                  theme.text1Hover,
                                )}
                                onClick={() => {
                                  navigator.clipboard.writeText(endpoint.path);
                                  showNotification("Copied to clipboard");
                                }}
                              />
                              <Link
                                className={clsx(
                                  "hover:underline truncate relative z-10 flex gap-x-1",
                                  theme.text3,
                                )}
                                to={endpoint.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {endpoint.path}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Popover>
                  )}
                </div>
              }
            />
          </div>
        )}
      </div>

      <div className="flex justify-end items-start">
        <Link
          to={`/${owner}/${appName}/${environment?.branch}/console`}
          className="z-10"
        >
          <Button disabled={environment?.status !== "running"}>Console</Button>
        </Link>
      </div>
    </div>
  );
};
