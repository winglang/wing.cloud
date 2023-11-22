import clsx from "clsx";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { useTheme } from "../../../design-system/theme-provider.js";
import { getTime } from "../../../utils/time.js";
import type { Log } from "../../../utils/wrpc.js";

import { CollapsibleItem } from "./collapsible-item.js";
export interface RuntimeLogsProps {
  logs: Log[];
  loading?: boolean;
}

export const RUNTIME_LOGS_ID = "runtime-logs";

export const RuntimeLogs = ({ logs, loading }: RuntimeLogsProps) => {
  const { theme } = useTheme();

  const location = useLocation();

  const locationHash = useMemo(() => {
    if (location.hash) {
      return location.hash.slice(1);
    }
  }, [location.search]);

  return (
    <CollapsibleItem
      id={RUNTIME_LOGS_ID}
      title="Runtime logs"
      defaultOpen={locationHash === RUNTIME_LOGS_ID}
      loading={loading}
      children={
        <div className="text-2xs font-mono py-4 px-3">
          {logs.length === 0 && (
            <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
              No build logs.
            </div>
          )}
          {logs.map((log, index) => (
            <div
              key={index}
              className={clsx(
                theme.bgInputHover,
                "w-full flex gap-2 pl-6 pr-1 py-0.5",
              )}
            >
              <div className={clsx(theme.text2)}>{getTime(log.timestamp)}</div>
              <div className={clsx(theme.text1)}>{log.message}</div>
            </div>
          ))}
        </div>
      }
    />
  );
};
