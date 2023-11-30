import { Console } from "@wingconsole/ui";
import clsx from "clsx";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../../../components/error-boundary.js";
import { Header } from "../../../../../components/header.js";
import { SpinnerLoader } from "../../../../../components/spinner-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { wrpc } from "../../../../../utils/wrpc.js";

const ConsolePage = () => {
  const { theme, mode } = useTheme();
  const { owner, appName, branch } = useParams();

  const environment = wrpc["app.environment"].useQuery({
    owner: owner!,
    appName: appName!,
    branch: branch!,
  });

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
            }${url.replace("http://", "")}/trpc`}
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
  return (
    <div className="flex flex-col h-full">
      <Header />
      <ErrorBoundary>
        <ConsolePage />
      </ErrorBoundary>
    </div>
  );
};
