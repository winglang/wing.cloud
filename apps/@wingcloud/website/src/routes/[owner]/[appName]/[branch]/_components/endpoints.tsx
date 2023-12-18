import clsx from "clsx";
import { useCallback, useContext } from "react";
import { useParams } from "react-router-dom";

import { SpinnerLoader } from "../../../../../components/spinner-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { AnalyticsContext } from "../../../../../utils/analytics-provider.js";
import type { Endpoint } from "../../../../../utils/wrpc.js";

export interface EndpointsProps {
  id: string;
  isOpen: boolean;
  endpoints: Endpoint[];
  loading?: boolean;
  environmentType?: string;
}

export const Endpoints = ({
  id,
  isOpen,
  endpoints,
  loading,
  environmentType,
}: EndpointsProps) => {
  const { theme } = useTheme();
  const { track } = useContext(AnalyticsContext);
  const { appName, branch } = useParams();
  const onEndpointClick = useCallback(
    (endpoint: Endpoint) => {
      track("cloud_endpoint_visited", {
        repo: appName,
        branch,
        type: environmentType,
        endpoint_path: endpoint.path,
        endpoint_url: endpoint.publicUrl,
        endpoint_label: endpoint.label,
      });
    },
    [track, branch, appName, environmentType],
  );
  return (
    <div
      className={clsx(
        "w-full rounded border",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      <button
        id={id}
        className={clsx(
          "flex items-center justify-between w-full text-left p-4 outline-none",
          isOpen && "border-b rounded-t shadow-sm",
          !isOpen && "rounded",
          theme.borderInput,
          theme.textInput,
          loading && "cursor-not-allowed opacity-50",
        )}
      >
        <div className="flex items-center flex-grow gap-2">
          <div className="font-medium text-sm pl-6">Endpoints</div>
        </div>
      </button>

      {isOpen && (
        <>
          {loading && (
            <div className="flex items-center justify-center p-4">
              <SpinnerLoader size="sm" />
            </div>
          )}
          {!loading && (
            <div className="text-2xs font-mono">
              {endpoints.length === 0 && (
                <div className={clsx(theme.text2, "w-full py-4 text-center")}>
                  No Endpoints.
                </div>
              )}
              {endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="flex flex-grow flex-row px-4 py-2 gap-4 sm:gap-6 transition-all w-full pl-10"
                >
                  <div className="flex flex-col gap-1 truncate w-1/2">
                    <div className={clsx("text-xs", theme.text2)}>Label</div>
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
                    <div className={clsx("text-xs", theme.text2)}>URL</div>
                    <div
                      className={clsx(
                        "truncate text-xs font-medium",
                        theme.text1,
                        "h-5 flex",
                      )}
                    >
                      {endpoint.browserSupport ? (
                        <a
                          className="hover:underline truncate h-full"
                          href={endpoint.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => onEndpointClick(endpoint)}
                        >
                          {endpoint.publicUrl}
                        </a>
                      ) : (
                        endpoint.publicUrl
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
