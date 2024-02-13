import { GlobeAltIcon, BoltIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useCallback, useContext } from "react";
import { useParams } from "react-router-dom";

import { SectionTitle } from "../../../../../components/section-title.js";
import { SpinnerLoader } from "../../../../../components/spinner-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { AnalyticsContext } from "../../../../../utils/analytics-provider.js";
import type { Endpoint, Environment } from "../../../../../utils/wrpc.js";

export interface EndpointsProps {
  endpoints: Endpoint[];
  loading?: boolean;
  environment?: Environment;
}

export const Endpoints = ({
  endpoints,
  loading,
  environment,
}: EndpointsProps) => {
  const { theme } = useTheme();
  const { track } = useContext(AnalyticsContext);
  const { appName, branch } = useParams();

  const onEndpointClick = useCallback(
    (endpoint: Endpoint) => {
      track("cloud_endpoint_visited", {
        repo: appName,
        branch,
        type: environment?.type,
        endpoint_path: endpoint.path,
        endpoint_url: endpoint.publicUrl,
        endpoint_label: endpoint.label,
      });
    },
    [track, branch, appName, environment],
  );

  return (
    <div
      className={clsx(
        "w-full rounded-md border p-4 md:p-6",
        "shadow-sm",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      {loading && (
        <div className="flex items-center justify-center p-4">
          <SpinnerLoader size="sm" />
        </div>
      )}
      {!loading && (
        <div className="space-y-1">
          {(endpoints.length === 0 || environment?.status !== "running") && (
            <div className={clsx(theme.text2, "w-full py-4 text-center")}>
              No Endpoints.
            </div>
          )}
          {environment?.status === "running" &&
            endpoints.map((endpoint, index) => (
              <div
                key={index}
                className={clsx(
                  "flex flex-grow flex-row gap-4 sm:gap-6 transition-all w-full",
                  theme.bg4,
                  theme.bg4Hover,
                )}
              >
                <div className="flex flex-col gap-1 truncate w-1/2">
                  <div
                    className={clsx(
                      "truncate text-xs font-medium",
                      theme.text1,
                    )}
                  >
                    {endpoint.label}
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-1/2">
                  <div
                    className={clsx(
                      "truncate text-xs font-medium",
                      theme.text1,
                      "h-5 flex",
                    )}
                  >
                    {endpoint.browserSupport ? (
                      <GlobeAltIcon className="w-4 h-4 mr-1 text-violet-700 dark:text-violet-400" />
                    ) : (
                      <BoltIcon className="w-4 h-4 mr-1 text-amber-500 dark:text-amber-400" />
                    )}
                    <a
                      className="hover:underline truncate h-full"
                      href={endpoint.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => onEndpointClick(endpoint)}
                    >
                      {endpoint.publicUrl}
                    </a>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
