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
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { Link, useParams } from "react-router-dom";

import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { useTheme } from "../../design-system/theme-provider.js";
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
    <div className="flex flex-col gap-1">
      <div className={clsx("text-sm", theme.text2)}>{label}</div>
      <div className="text-sm text-left items-center flex">{value}</div>
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
      <div
        className={clsx(
          "flex items-center justify-between w-full text-left p-6",
          isOpen && "border-b rounded-t",
          !isOpen && "rounded",
          theme.borderInput,
          theme.bgInput,
          theme.textInput,
        )}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx("flex  items-center")}
        >
          {isOpen ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
          <div className="ml-2 font-medium text-sm">{title}</div>
        </button>

        <div className="flex flex-grow justify-end gap-4">{rightOptions}</div>
      </div>

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
    <div className="max-w-5xl mx-auto">
      {environment.isLoading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}
      {!environment.isLoading && (
        <div className="space-y-4">
          <div className="bg-white p-6 w-full rounded shadow">
            <div className="flex gap-4">
              <div className="rounded w-80 h-40 shadow p-1 flex items-center justify-center border border-slate-200 bg-slate-100">
                {status !== "running" && (
                  <NoSymbolIcon className="w-10 h-10 text-slate-300" />
                )}
                {status === "running" && (
                  <img
                    src="/assets/console-preview.png"
                    alt="console-preview"
                    className="rounded"
                  />
                )}
              </div>

              <div className="flex flex-grow">
                <div className="flex flex-col gap-6 px-4">
                  <div className="flex gap-8">
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
                          <div
                            className={clsx(
                              "text-xs rounded-xl px-2 py-0.5 capitalize font-semibold",
                              theme.text1,
                            )}
                          >
                            {status}
                          </div>
                        </div>
                      }
                    />
                    <InfoItem
                      label="Environment"
                      value={
                        <div className="text-xs rounded-lg px-2 py-0.5 capitalize font-semibold bg-slate-100 text-slate-700 text-center">
                          Preview
                        </div>
                      }
                    />
                  </div>
                  <div className="flex gap-8">
                    <InfoItem
                      label="Branch"
                      value={environment.data?.environment.branch}
                    />
                  </div>
                </div>

                <div className="flex flex-grow justify-end">
                  <Link to="./preview">
                    <Button>Visit</Button>
                  </Link>
                </div>
              </div>
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
                    className={clsx(theme.text1, theme.bgInputHover, "w-full")}
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
                    className={clsx(theme.text1, theme.bgInputHover, "w-full")}
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
