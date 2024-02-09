import {
  createContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useParams } from "react-router-dom";

import type { App } from "../utils/wrpc.js";
import { wrpc } from "../utils/wrpc.js";

export interface AppDataProviderContext {
  app?: App;
  setOwner: (owner: string) => void;
  setAppName: (appName: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}
const DEFAULT_CONTEXT: AppDataProviderContext = {
  setOwner: () => {},
  setAppName: () => {},
  app: undefined,
  isLoading: true,
  isFetching: false,
  isError: false,
};
export const AppDataProviderContext =
  createContext<AppDataProviderContext>(DEFAULT_CONTEXT);

export const AppDataProvider = ({ children }: PropsWithChildren) => {
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
    <AppDataProviderContext.Provider
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
    </AppDataProviderContext.Provider>
  );
};
