import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  useMemo,
  type ReactNode,
  useState,
  type PropsWithChildren,
  useEffect,
} from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "../../design-system/button.js";
import { SkeletonLoader } from "../../design-system/skeleton-loader.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { getDateTime } from "../../utils/time.js";
import { wrpc } from "../../utils/wrpc.js";

const InfoItem = ({
  label,
  value,
  loading,
}: {
  label: string;
  value: ReactNode;
  loading?: boolean;
}) => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-1 truncate">
      <div className={clsx("text-xs", theme.text2)}>{label}</div>

      <SkeletonLoader loading={loading}>
        <div
          className={clsx(
            "truncate text-xs font-medium",
            theme.text1,
            "h-5 flex",
          )}
        >
          {value}
        </div>
      </SkeletonLoader>
    </div>
  );
};

const CollapsibleItem = ({
  title,
  disabled,
  rightOptions,
  children,
}: PropsWithChildren<{
  title: string;
  disabled?: boolean;
  rightOptions?: ReactNode;
}>) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={clsx(
        "w-full rounded border",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      <button
        className={clsx(
          "flex items-center justify-between w-full text-left p-6",
          isOpen && "border-b rounded-t shadow-sm",
          !isOpen && "rounded",
          theme.borderInput,
          theme.textInput,
          disabled && "cursor-not-allowed opacity-50",
        )}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center flex-grow gap-2">
          {isOpen && <ChevronDownIcon className="h-4 w-4" />}
          {!isOpen && <ChevronRightIcon className="h-4 w-4" />}
          <div className="font-medium text-sm">{title}</div>
        </div>

        <div className="flex justify-end gap-4">{rightOptions}</div>
      </button>

      {isOpen && <div className="px-6 pb-6 pt-4">{children}</div>}
    </div>
  );
};

export const Component = () => {
  const { theme } = useTheme();
  const { environmentId } = useParams();

  const environment = wrpc["app.environment"].useQuery(
    {
      environmentId: environmentId!,
    },
    {
      enabled: environmentId != undefined,
      // TODO: query invalidation
      refetchInterval: 1000 * 10,
    },
  );

  const logs = wrpc["app.environment.logs"].useQuery(
    {
      environmentId: environmentId!,
    },
    {
      enabled: environmentId != undefined,
      // TODO: query invalidation
      refetchInterval: 1000 * 10,
    },
  );

  const status = useMemo(() => {
    return environment.data?.environment.status ?? "";
  }, [environment.data?.environment.status]);

  const tests = useMemo(() => {
    return environment.data?.environment.testResults?.testResults ?? [];
  }, [environment.data?.environment.testResults?.testResults]);

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 sm:py-6 transition-all">
      <div className="space-y-4">
        <div
          className={clsx(
            "p-6 w-full rounded gap-4 flex border",
            theme.bgInput,
            theme.borderInput,
          )}
        >
          <div className="flex flex-grow flex-col gap-4 sm:gap-6 truncate transition-all">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 transition-all">
              <InfoItem
                label="Environment"
                loading={environment.isLoading}
                value={
                  <div className="rounded-lg px-2 py-0.5 capitalize bg-slate-100 dark:bg-slate-750 text-center truncate">
                    {environment.data?.environment.type}
                  </div>
                }
              />

              <InfoItem
                label="Branch"
                loading={environment.isLoading}
                value={
                  <a
                    className="hover:underline truncate w-full h-full"
                    href={`https://github.com/${environment.data?.environment.repo}/tree/${environment.data?.environment.branch}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {environment.data?.environment.branch}
                  </a>
                }
              />

              <InfoItem
                label="Status"
                loading={environment.isLoading}
                value={
                  <div className="flex items-center truncate">
                    <div
                      title={status}
                      className={clsx(
                        "w-2.5 h-2.5",
                        "rounded-full shrink-0",
                        status === "initializing" &&
                          "bg-slate-400 animate-pulse",
                        status === "tests" && "bg-yellow-300 animate-pulse",
                        status === "deploying" && "bg-yellow-300 animate-pulse",
                        status === "running" && "bg-green-300",
                        status === "failed" && "bg-red-300",
                      )}
                    />
                    <div className="rounded-xl px-2 py-0.5 capitalize truncate">
                      {status}
                    </div>
                  </div>
                }
              />

              <InfoItem
                label="Created"
                loading={environment.isLoading}
                value={
                  environment.data &&
                  getDateTime(environment.data?.environment.createdAt)
                }
              />

              <div className="col-span-2 sm:col-span-3 transition-all">
                <InfoItem
                  label="URLs"
                  loading={environment.isLoading}
                  value={
                    <div className="truncate">
                      <a
                        className="hover:underline truncate font-mono"
                        href={`https://github.com/${environment.data?.environment.repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {`https://github.com/${environment.data?.environment.repo}`}
                      </a>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end items-start">
            <Link to="./preview">
              <Button disabled={status !== "running"}>Visit</Button>
            </Link>
          </div>
        </div>

        <CollapsibleItem
          title="Tests"
          rightOptions={
            <div className="flex gap-2 text-xs">
              <div className="flex gap-0.5">
                <span>{tests.filter((test) => test.pass).length}</span>
                <CheckCircleIcon className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex gap-0.5">
                <span>{tests.filter((test) => !test.pass).length}</span>
                <XCircleIcon className="w-4 h-4 text-red-400" />
              </div>
            </div>
          }
          children={
            <div className="text-2xs font-mono">
              {(!logs.data || logs.data?.tests.length === 0) && (
                <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
                  No test logs.
                </div>
              )}
              {logs.data?.tests.map((log, index) => (
                <div
                  key={index}
                  className={clsx(
                    theme.text1,
                    theme.bgInputHover,
                    "w-full py-0.5",
                  )}
                >
                  {log.message}
                </div>
              ))}
            </div>
          }
        />

        <CollapsibleItem
          title="Build"
          children={
            <div className="text-2xs font-mono">
              {(!logs.data || logs.data?.build.length === 0) && (
                <div className={clsx(theme.text2, "w-full py-0.5 text-center")}>
                  No build logs.
                </div>
              )}
              {logs.data?.build.map((log, index) => (
                <div
                  key={index}
                  className={clsx(
                    theme.text1,
                    theme.bgInputHover,
                    "w-full py-0.5",
                  )}
                >
                  {log.message}
                </div>
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
};
