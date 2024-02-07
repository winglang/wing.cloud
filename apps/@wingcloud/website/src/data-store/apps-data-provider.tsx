import { createContext, type PropsWithChildren, useContext } from "react";

import type { App } from "../utils/wrpc.js";
import { wrpc } from "../utils/wrpc.js";

import { AuthDataProviderContext } from "./auth-data-provider.js";

export interface AppsDataProviderContext {
  apps: App[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}
const DEFAULT_CONTEXT: AppsDataProviderContext = {
  apps: undefined,
  isLoading: true,
  isFetching: false,
  isError: false,
};
export const AppsDataProviderContext =
  createContext<AppsDataProviderContext>(DEFAULT_CONTEXT);

export const AppsDataProvider = ({ children }: PropsWithChildren) => {
  const { user } = useContext(AuthDataProviderContext);

  const listAppsQuery = wrpc["app.list"].useQuery(
    {
      owner: user?.username!,
    },
    {
      enabled: !!user?.username,
    },
  );

  return (
    <AppsDataProviderContext.Provider
      value={{
        apps: listAppsQuery.data?.apps,
        isLoading: listAppsQuery.isLoading,
        isFetching: listAppsQuery.isFetching,
        isError: listAppsQuery.isError,
      }}
    >
      {children}
    </AppsDataProviderContext.Provider>
  );
};
