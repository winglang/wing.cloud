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
import { AnalyticsContext } from "../../../../../utils/analytics-provider.js";
import { wrpc } from "../../../../../utils/wrpc.js";

const ConsolePage = () => {
  const { theme, mode } = useTheme();
  const { owner, appName, branch } = useParams();

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
    return environment.data?.environment.url ?? "";
  }, [environment.data?.environment.url]);

  return (
    <div className={clsx("w-full flex-grow overflow-auto")}>
      {environment.isLoading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
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
  const { owner, appName, branch } = useParams();
  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[
          { label: appName!, to: `/${owner}/${appName}` },
          {
            label: branch!,
            to: `/${owner}/${appName}/${branch}`,
            icon: <BranchIcon className="w-4 h-4 text-slate-700" />,
          },
          {
            label: "Console",
            to: `/${owner}/${appName}/${branch}/console`,
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
