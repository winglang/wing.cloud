import { Console } from "@wingconsole/ui";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { SpinnerLoader } from "../../components/spinner-loader.js";
import { wrpc } from "../../utils/wrpc.js";

export const Component = () => {
  const { environmentId } = useParams();

  const environment = wrpc["app.environment"].useQuery(
    {
      environmentId: environmentId!,
    },
    {
      enabled: environmentId != undefined,
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
        <div className="bg-white p-4 w-full h-full">
          <div className="bg-slate-300 dark:bg-slate-800 w-full h-full">
            <Console
              trpcUrl={`${url}/trpc`}
              wsUrl={`${url.startsWith("http:") ? "ws://" : "wss://"}${
                location.host
              }/trpc`}
              layout={1}
              theme="light"
              onTrace={(trace) => {
                // Playground and Learn need to be able to listen to all traces.
                window.parent.postMessage({ trace }, "*");
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
