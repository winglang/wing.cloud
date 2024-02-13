import clsx from "clsx";

import { SpinnerLoader } from "../../../../../components/spinner-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { getTime } from "../../../../../utils/time.js";
import type { Log } from "../../../../../utils/wrpc.js";

export interface AppLogsProps {
  id: string;
  logs: Log[];
  loading?: boolean;
  label: string;
}

export const AppLogs = ({ id, logs, loading, label }: AppLogsProps) => {
  const { theme } = useTheme();

  return (
    <div
      id={id}
      className={clsx(
        "w-full rounded-md border",
        theme.bgInput,
        theme.borderInput,
        "shadow-sm",
      )}
    >
      {loading && (
        <div className="flex items-center justify-center p-4 md:p-6">
          <SpinnerLoader size="sm" />
        </div>
      )}
      {!loading && (
        <div className="text-2xs font-mono p-4 md:p-6">
          {logs.length === 0 ? (
            <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
              No {label} logs.
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={clsx(
                  theme.bgInputHover,
                  "w-full flex gap-2 px-1 py-0.5",
                )}
              >
                <div className={clsx(theme.text2)}>
                  {getTime(log.timestamp)}
                </div>
                <div
                  className={clsx(theme.text1, "break-all whitespace-pre-wrap")}
                >
                  {log.message}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
