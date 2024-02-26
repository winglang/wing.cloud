import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { CommandLineIcon } from "@heroicons/react/24/solid";
import { Console } from "@wingconsole/ui";
import clsx from "clsx";
import { useContext, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../../../components/error-boundary.js";
import { Header } from "../../../../../components/header.js";
import { SpinnerLoader } from "../../../../../components/spinner-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../../../icons/branch-icon.js";
import { ConsolePreviewIcon } from "../../../../../icons/console-preview-icon.js";
import { AnalyticsContext } from "../../../../../utils/analytics-provider.js";
import { wrpc } from "../../../../../utils/wrpc.js";

const ConsolePage = () => {
  const { theme, mode } = useTheme();
  const { owner, appName, "*": branch } = useParams();

  const environment = wrpc["app.environment"].useQuery({
    owner: owner!,
    appName: appName!,
    branch: branch!,
  });

  const { track } = useContext(AnalyticsContext);

  useEffect(() => {
    if (!appName || !branch || !environment.data?.environment) {
      return;
    }
    track("cloud_console_visited", {
      repo: appName,
      branch,
      type: environment.data?.environment.type,
    });
  }, [appName, branch, track, environment.data?.environment]);

  const url = useMemo(() => {
    if (!environment.data?.environment) {
      return;
    }
    if (environment.data?.environment.status !== "running") {
      return;
    }
    return environment.data.environment.url;
  }, [environment.data?.environment.url]);

  return (
    <div className={clsx("w-full flex-grow overflow-auto")}>
      {environment.isLoading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {!url && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <ConsolePreviewIcon className="w-full text-slate-500" />
            <div
              className={clsx(
                theme.text3,
                "font-semibold flex items-center gap-1 justify-center text-sm",
              )}
            >
              <ExclamationTriangleIcon className="w-5 h-5" />
              <div>Environment is not running</div>
            </div>
          </div>
        </div>
      )}

      {url && (
        <div
          className={clsx("w-full h-full border absolute", theme.borderInput)}
        >
          <Console
            trpcUrl={`${url}/trpc`}
            wsUrl={`${
              url.startsWith("http:") ? "ws://" : "wss://"
            }${url.replace(/^https?:\/\//, "")}/trpc`}
            layout={5}
            theme={mode}
            onTrace={(trace) => {
              window.parent.postMessage({ trace }, "*");
            }}
          />
        </div>
      )}
    </div>
  );
};

export const Component = () => {
  const { owner, appName, "*": branch } = useParams();
  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[
          {
            label: appName!,
            to: `/${owner}/${appName}`,
          },
          {
            label: branch!,
            to: `/${owner}/${appName}/environment/${branch}`,
            icon: <BranchIcon className="w-4 h-4 text-slate-700" />,
          },
          {
            label: "Console",
            to: `/${owner}/${appName}/console/${branch}`,
            icon: <CommandLineIcon className="w-4 h-4 text-slate-500" />,
          },
        ]}
      />
      <ErrorBoundary>
        <ConsolePage />
      </ErrorBoundary>
    </div>
  );
};
