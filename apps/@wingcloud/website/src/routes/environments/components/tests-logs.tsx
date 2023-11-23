import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { useTheme } from "../../../design-system/theme-provider.js";
import { getTime } from "../../../utils/time.js";
import type { TestLog, TestResult } from "../../../utils/wrpc.js";

import { CollapsibleItem } from "./collapsible-item.js";

export interface TestsLogsProps {
  logs: TestLog[];
  testResults: TestResult[];
  loading?: boolean;
  defaultOpen?: boolean;
}

export const TEST_LOGS_ID = "test-logs";

export const TestsLogs = ({
  logs,
  testResults,
  loading,
  defaultOpen,
}: TestsLogsProps) => {
  const { theme } = useTheme();

  return (
    <CollapsibleItem
      id={TEST_LOGS_ID}
      title="Tests"
      defaultOpen={defaultOpen}
      loading={loading}
      rightOptions={
        <div className="flex gap-2 text-xs">
          <div className="flex gap-0.5">
            <span>{testResults.filter((test) => test.pass).length}</span>
            <CheckCircleIcon className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex gap-0.5">
            <span>{testResults.filter((test) => !test.pass).length}</span>
            <XCircleIcon className="w-4 h-4 text-red-400" />
          </div>
        </div>
      }
      children={
        <div className="text-2xs font-mono px-3 py-4">
          {logs.length === 0 && (
            <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
              No test logs.
            </div>
          )}
          {logs.map((log) => (
            <div
              id={log.path}
              key={log.path}
              className={clsx(theme.bgInputHover, "px-1")}
            >
              <div className="flex gap-1 items-center">
                <div className="grow gap-y-0.5">
                  <div className="flex gap-2">
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
                    <div className="flex gap-1">
                      <div className={clsx(theme.text1)}>
                        {log.path.split("/").pop()}
                      </div>
                      <div className={clsx(theme.text2)}>({log.time}ms)</div>
                    </div>
                  </div>

                  {log.traces.map((trace, index) => (
                    <div key={index} className="flex gap-2 pl-6 py-0.5">
                      <div className={clsx(theme.text2)}>
                        {getTime(trace.timestamp)}
                      </div>
                      <div className={clsx(theme.text2)}>{trace.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    />
  );
};
