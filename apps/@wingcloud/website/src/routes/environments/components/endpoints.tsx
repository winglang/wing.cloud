import clsx from "clsx";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { useTheme } from "../../../design-system/theme-provider.js";
import type { Endpoint } from "../../../utils/wrpc.js";

import { CollapsibleItem } from "./collapsible-item.js";

export interface EndpointsProps {
  endpoints: Endpoint[];
  loading?: boolean;
}

export const Endpoints = ({ endpoints, loading }: EndpointsProps) => {
  const { theme } = useTheme();

  const location = useLocation();

  const locationHash = useMemo(() => {
    // url includes an ID with #
    if (location.hash) {
      return location.hash.slice(1);
    }
  }, [location.search]);

  return (
    <CollapsibleItem
      id="endpoints"
      title="Endpoints"
      defaultOpen={locationHash === "endpoints"}
      loading={loading}
      children={
        <div className="text-2xs font-mono">
          {endpoints.length === 0 && (
            <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
              No Endpoints.
            </div>
          )}
          {endpoints.map((endpoint, index) => (
            <div className="flex flex-grow flex-row gap-4 sm:gap-6 transition-all w-full mb-2">
              <div className="flex flex-col gap-1 truncate w-1/3">
                <div className={clsx("text-xs", theme.text2)}>Type</div>
                <div
                  className={clsx(
                    "truncate text-xs font-medium",
                    theme.text1,
                    "h-5 flex",
                  )}
                >
                  {endpoint.type.replace("@winglang/sdk.", "")}
                </div>
              </div>

              <div className="flex flex-col gap-1 w-1/3">
                <div className={clsx("text-xs", theme.text2)}>Path</div>
                <div
                  className={clsx(
                    "truncate text-xs font-medium",
                    theme.text1,
                    "h-5 flex",
                  )}
                >
                  <span>{endpoint.path}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 w-1/3">
                <div className={clsx("text-xs", theme.text2)}>URL</div>
                <div
                  className={clsx(
                    "truncate text-xs font-medium",
                    theme.text1,
                    "h-5 flex",
                  )}
                >
                  <a
                    className="hover:underline truncate h-full"
                    href={endpoint.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {endpoint.publicUrl}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    />
  );
};
