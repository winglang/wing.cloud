import { createContext, useState, type PropsWithChildren } from "react";

import type { App } from "../utils/wrpc.js";
import { wrpc } from "../utils/wrpc.js";

export interface CurrentAppDataProviderContext {
  app?: App;
  setOwner: (owner: string) => void;
  setAppName: (appName: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}
const DEFAULT_CONTEXT: CurrentAppDataProviderContext = {
  setOwner: () => {},
  setAppName: () => {},
  app: undefined,
  isLoading: true,
  isFetching: false,
  isError: false,
};
export const CurrentAppDataProviderContext =
  createContext<CurrentAppDataProviderContext>(DEFAULT_CONTEXT);

export const CurrentAppDataProvider = ({ children }: PropsWithChildren) => {
  const [owner, setOwner] = useState<string>();
  const [appName, setAppName] = useState<string>();

  const getAppQuery = wrpc["app.getByName"].useQuery(
    {
      owner: owner!,
      appName: appName!,
    },
    {
      enabled: !!owner && !!appName,
    },
  );

  return (
    <CurrentAppDataProviderContext.Provider
      value={{
        app: getAppQuery.data?.app,
        setOwner,
        setAppName,
        isLoading: getAppQuery.isLoading,
        isFetching: getAppQuery.isFetching,
        isError: getAppQuery.isError,
      }}
    >
      {children}
    </CurrentAppDataProviderContext.Provider>
  );
};
