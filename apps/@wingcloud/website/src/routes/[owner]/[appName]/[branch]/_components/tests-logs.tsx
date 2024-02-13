import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useState } from "react";

import { SpinnerLoader } from "../../../../../components/spinner-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { getTime } from "../../../../../utils/time.js";
import type { TestLog, TestResult } from "../../../../../utils/wrpc.js";

export interface TestsLogsProps {
  id: string;
  logs: TestLog[];
  testResults: TestResult[];
  loading?: boolean;
  selectedTestId?: string;
}
export const TestsLogs = ({
  id,
  logs,
  testResults,
  loading,
  selectedTestId,
}: TestsLogsProps) => {
  const { theme } = useTheme();

  const [animateLogId, setAnimateLogId] = useState(selectedTestId);

  useEffect(() => {
    if (animateLogId) {
      const element = document.querySelector(`#${selectedTestId}`);
      console.log(selectedTestId, element);

      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedTestId]);

  useEffect(() => {
    setAnimateLogId(selectedTestId);
    const timeout = setTimeout(() => {
      setAnimateLogId(undefined);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [selectedTestId]);

  return (
    <div>
      <div
        className={clsx(
          "w-full rounded-md border",
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
          <div className="text-2xs font-mono px-3 py-4">
            {logs.length === 0 && (
              <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
                No test logs.
              </div>
            )}
            {logs.map((log) => (
              <div
                id={log.id}
                key={log.path}
                className={clsx(
                  "px-1 truncate",
                  theme.bgInputHover,
                  animateLogId === log.id && [
                    theme.bg3,
                    "animate-pulse transition-all",
                  ],
                  selectedTestId === log.id && theme.bg3,
                )}
              >
                <div className="flex gap-1 items-center truncate">
                  <div className="grow gap-y-0.5 truncate">
                    <div className="flex gap-2 truncate">
                      <div className="self-center">
                        {log.pass ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className={clsx(theme.text2)}>
                        {getTime(log.timestamp)}
                      </div>
                      <div className="flex gap-1 truncate">
                        <div className={clsx(theme.text1, "truncate")}>
                          {log.path.split("/").pop()}
                        </div>
                        <div className={clsx(theme.text2, "truncate")}>
                          ({log.time}ms)
                        </div>
                      </div>
                    </div>

                    {log.traces.map((trace, index) => (
                      <div key={index} className="flex gap-2 pl-6 py-0.5">
                        <div className={clsx(theme.text2)}>
                          {getTime(trace.timestamp)}
                        </div>
                        <div
                          className={clsx(
                            log.pass && theme.text2,
                            !log.pass && "text-red-500",
                            "break-all whitespace-pre-wrap",
                          )}
                        >
                          {trace.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          id={id}
          className={clsx(
            "flex items-center w-full text-left p-4",
            "flex flex-grow justify-end gap-2 text-xs",
            "rounded-b-md",
            "border-t",
            theme.borderInput,
            theme.bg4,
            theme.textInput,
          )}
        >
          <div className="flex gap-0.5">
            <span>{testResults.filter((test) => test.pass).length}</span>
            <CheckCircleIcon className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex gap-0.5">
            <span>{testResults.filter((test) => !test.pass).length}</span>
            <XCircleIcon className="w-4 h-4 text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
