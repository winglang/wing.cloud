import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  NoSymbolIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  useMemo,
  type ReactNode,
  useState,
  type PropsWithChildren,
} from "react";
import { Link, useParams } from "react-router-dom";

import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { getDateTime } from "../../utils/time.js";
import { wrpc } from "../../utils/wrpc.js";

export const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-1 truncate">
      <div className={clsx("text-xs", theme.text2)}>{label}</div>
      <div
        className={clsx(
          "flex items-center truncate text-xs font-medium",
          //theme.text1,
          "text-slate-800 dark:text-slate-250",
        )}
      >
        {value}
      </div>
    </div>
  );
};

const CollapsibleItem = ({
  title,
  rightOptions,
  children,
}: PropsWithChildren<{ title: string; rightOptions?: ReactNode }>) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white w-full rounded shadow">
      <button
        className={clsx(
          "flex items-center justify-between w-full text-left p-6",
          isOpen && "border-b rounded-t shadow-sm",
          !isOpen && "rounded",
          theme.borderInput,
          theme.bgInput,
          theme.textInput,
        )}
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
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 sm:py-6">
      {environment.isLoading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}
      {!environment.isLoading && (
        <div className="space-y-4">
          <div className="bg-white p-6 w-full rounded shadow gap-4 flex">
            <div className="flex flex-grow flex-col gap-4 sm:gap-6 truncate transition-all">
              <div className="flex gap-4 sm:gap-10 lg:gap-16 transition-all">
                <InfoItem
                  label="Branch"
                  value={
                    <a
                      className="hover:underline truncate"
                      href={`https://github.com/${environment.data?.environment.repo}/tree/${environment.data?.environment.branch}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {environment.data?.environment.branch}
                    </a>
                  }
                />
                <InfoItem
                  label="Environment"
                  value={
                    <div className="rounded-lg px-2 py-0.5 capitalize bg-slate-100 text-center">
                      {environment.data?.environment.type}
                    </div>
                  }
                />

                <InfoItem
                  label="Status"
                  value={
                    <div className="flex items-center">
                      <div
                        title={status}
                        className={clsx(
                          "w-2.5 h-2.5",
                          "rounded-full",
                          status === "initializing" &&
                            "bg-slate-400 animate-pulse",
                          status === "deploying" &&
                            "bg-yellow-300 animate-pulse",
                          status === "running" && "bg-green-300",
                          status === "failed" && "bg-red-300",
                        )}
                      />
                      <div className="rounded-xl px-2 py-0.5 capitalize">
                        {status}
                      </div>
                    </div>
                  }
                />

                {environment.data?.environment.createdAt && (
                  <InfoItem
                    label="Created"
                    value={getDateTime(environment.data?.environment.createdAt)}
                  />
                )}
              </div>

              <InfoItem
                label="URLs"
                value={
                  <a
                    className="hover:underline truncate font-mono"
                    href={`https://github.com/${environment.data?.environment.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {`https://github.com/${environment.data?.environment.repo}`}
                  </a>
                }
              />
            </div>
            <div className="flex justify-end items-start">
              <Link to="./preview">
                <Button>Visit</Button>
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
      )}
    </div>
  );
};
