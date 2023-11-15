import {
  CheckBadgeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  NoSymbolIcon,
  XMarkIcon,
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
  children,
}: PropsWithChildren<{ title: string }>) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center p-2 w-full text-left",
          theme.bgInputHover,
          theme.bgInput,
          theme.textInput,
        )}
      >
        {isOpen ? (
          <ChevronDownIcon className="h-5 w-5" />
        ) : (
          <ChevronRightIcon className="h-5 w-5" />
        )}
        <span className="ml-2 font-medium">{title}</span>
      </button>
      {isOpen && <div className="p-2">{children}</div>}
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
          <div className="bg-white p-4 w-full rounded shadow">
            <div className="flex gap-4 p-2">
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

          <div className="bg-white p-4 w-full rounded shadow space-y-2">
            <CollapsibleItem
              title="Test Logs"
              children={
                <div className="text-2xs font-mono">
                  {logs.data?.tests.map((log, index) => (
                    <div
                      key={index}
                      className={clsx(
                        theme.text1,
                        theme.bgInputHover,
                        "w-full",
                      )}
                    >
                      {log.message}
                    </div>
                  ))}
                </div>
              }
            />
          </div>

          <div className="bg-white p-4 w-full rounded shadow space-y-2">
            <CollapsibleItem
              title="Build Logs"
              children={
                <div className="text-2xs font-mono">
                  {logs.data?.build.map((log, index) => (
                    <div
                      key={index}
                      className={clsx(
                        theme.text1,
                        theme.bgInputHover,
                        "w-full",
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
      )}
    </div>
  );
};
