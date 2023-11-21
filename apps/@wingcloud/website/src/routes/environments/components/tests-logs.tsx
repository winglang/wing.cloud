import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { useTheme } from "../../../design-system/theme-provider.js";
import { getTime } from "../../../utils/time.js";
import type { Log, TestResult } from "../../../utils/wrpc.js";

import { CollapsibleItem } from "./collapsible-item.js";

export interface TestsLogsProps {
  logs: Log[];
  testResults: TestResult[];
  loading?: boolean;
}

export const TEST_LOGS_ID = "test-logs";

export const TestsLogs = ({ logs, testResults, loading }: TestsLogsProps) => {
  const { theme } = useTheme();

  const location = useLocation();

  const locationHash = useMemo(() => {
    if (location.hash) {
      return location.hash.slice(1);
    }
  }, [location.search]);

  return (
    <CollapsibleItem
      id={TEST_LOGS_ID}
      title="Tests"
      defaultOpen={locationHash === TEST_LOGS_ID}
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
        <div className="text-2xs font-mono">
          {logs.length === 0 && (
            <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
              No test logs.
            </div>
          )}
          {logs.map((log, index) => (
            <div
              key={index}
              className={clsx(theme.bgInputHover, "w-full py-0.5 flex gap-2")}
            >
              <div className={clsx(theme.text2)}>{getTime(log.time)}</div>
              <div className={clsx(theme.text1)}>{log.message}</div>
            </div>
          ))}
        </div>
      }
    />
  );
};
