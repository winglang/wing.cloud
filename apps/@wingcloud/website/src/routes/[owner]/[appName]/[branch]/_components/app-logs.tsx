import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { SpinnerLoader } from "../../../../../components/spinner-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { getTime } from "../../../../../utils/time.js";
import type { Log } from "../../../../../utils/wrpc.js";

export interface AppLogsProps {
  id: string;
  logs: Log[];
  loading?: boolean;
  isOpen: boolean;
  title: string;
  setIsOpen: (isOpen: boolean) => void;
}

export const AppLogs = ({
  id,
  logs,
  loading,
  isOpen,
  title,
  setIsOpen,
}: AppLogsProps) => {
  const { theme } = useTheme();

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
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center flex-grow gap-2">
          {isOpen ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
          <div className="font-medium text-sm">{title}</div>
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
            <div className="text-2xs font-mono py-4 px-3">
              {logs.length === 0 ? (
                <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
                  No {title} logs.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={clsx(
                      theme.bgInputHover,
                      "w-full flex gap-2 pl-6 pr-1 py-0.5",
                    )}
                  >
                    <div className={clsx(theme.text2)}>
                      {getTime(log.timestamp)}
                    </div>
                    <div
                      className={clsx(
                        theme.text1,
                        "break-all whitespace-pre-wrap",
                      )}
                    >
                      {log.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
