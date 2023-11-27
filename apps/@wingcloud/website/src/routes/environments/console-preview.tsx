import { Console } from "@wingconsole/ui";
import clsx from "clsx";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { SpinnerLoader } from "../../components/spinner-loader.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { wrpc } from "../../utils/wrpc.js";

export const Component = () => {
  const { theme, mode } = useTheme();
  const { owner, appName, branch } = useParams();

  const environment = wrpc["app.environment"].useQuery(
    {
      owner: owner!,
      appName: appName!,
      branch: branch!,
    },
    {
      enabled: !!appName && !!branch,
    },
  );

  const url = useMemo(() => {
    return environment.data?.environment.url ?? "";
  }, [environment.data?.environment.url]);

  return (
    <>
      {environment.isLoading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {url && (
        <div className={clsx("w-full h-full border", theme.borderInput)}>
          <Console
            trpcUrl={`${url}/trpc`}
            wsUrl={`${url.startsWith("http:") ? "ws://" : "wss://"}${
              location.host
            }/trpc`}
            layout={5}
            theme={mode}
            onTrace={(trace) => {
              window.parent.postMessage({ trace }, "*");
            }}
          />
        </div>
      )}
    </>
  );
};
