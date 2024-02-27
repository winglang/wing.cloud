import clsx from "clsx";
import { useCallback, useContext } from "react";
import { useParams } from "react-router-dom";

import { Duplicator } from "../../../../../components/duplicator.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { AnalyticsContext } from "../../../../../utils/analytics-provider.js";
import type { Endpoint, Environment } from "../../../../../utils/wrpc.js";

import { EndpointItemSkeleton } from "./endpoint-item-skeleton.js";
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
  const { appName, "*": branch } = useParams();
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
    <div className="space-y-2">
      {(loading || !environment) && (
        <Duplicator count={3}>
          <EndpointItemSkeleton />
        </Duplicator>
      )}
      {!loading && environment && (
        <>
          {(endpoints.length === 0 || environment.status !== "running") && (
            <div
              className={clsx(
                "space-y-2",
                "p-4 w-full border text-center rounded-md",
                theme.bgInput,
                theme.borderInput,
                theme.text1,
              )}
            >
              <h3 className={clsx("text-sm font-medium", theme.text2)}>
                No Endpoints found.
              </h3>
            </div>
          )}
          {environment.status === "running" &&
            endpoints.map((endpoint, index) => (
              <div key={index} onClick={() => onEndpointClick(endpoint)}>
                <EndpointItem key={index} endpoint={endpoint} />
              </div>
            ))}
        </>
      )}
    </div>
  );
};
