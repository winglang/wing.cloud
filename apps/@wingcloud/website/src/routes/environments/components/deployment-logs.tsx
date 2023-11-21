import clsx from "clsx";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { useTheme } from "../../../design-system/theme-provider.js";
import type { Log } from "../../../utils/wrpc.js";

import { CollapsibleItem } from "./collapsible-item.js";
export interface DeploymentLogsProps {
  logs: Log[];
  loading?: boolean;
}

export const DeploymentLogs = ({ logs, loading }: DeploymentLogsProps) => {
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
      id="logs"
      title="Deployment logs"
      defaultOpen={locationHash === "logs"}
      loading={loading}
      children={
        <div className="text-2xs font-mono">
          {logs.length === 0 && (
            <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
              No build logs.
            </div>
          )}
          {logs.map((log, index) => (
            <div
              key={index}
              className={clsx(theme.text1, theme.bgInputHover, "w-full py-0.5")}
            >
              {log.message}
            </div>
          ))}
        </div>
      }
    />
  );
};
