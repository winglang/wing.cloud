import clsx from "clsx";
import { useCallback, useContext } from "react";
import { useParams } from "react-router-dom";

import { SpinnerLoader } from "../../../../../components/spinner-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { AnalyticsContext } from "../../../../../utils/analytics-provider.js";
import type { Endpoint, Environment } from "../../../../../utils/wrpc.js";
import { EndpointItem } from "./endpoint-item.js";

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
    <div>
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
              <EndpointItem
                key={index}
                endpoint={endpoint}
                onClick={onEndpointClick}
              />
            ))}
        </div>
      )}
    </div>
  );
};
