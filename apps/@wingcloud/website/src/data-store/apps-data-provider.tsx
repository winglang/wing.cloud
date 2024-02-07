import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
  useMemo,
  useContext,
} from "react";

import type { App } from "../utils/wrpc.js";
import { wrpc } from "../utils/wrpc.js";

import { AuthDataProviderContext } from "./auth-data-provider.js";

export interface AppsDataProviderContext {
  apps: App[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}
const DEFAULT_CONTEXT: AppsDataProviderContext = {
  apps: [],
  isLoading: true,
  isFetching: false,
  isError: false,
};
export const AppsDataProviderContext =
  createContext<AppsDataProviderContext>(DEFAULT_CONTEXT);

export const AppsDataProvider = ({ children }: PropsWithChildren) => {
  const [apps, setApps] = useState<App[]>([]);

  const { user } = useContext(AuthDataProviderContext);

  const listAppsQuery = wrpc["app.list"].useQuery(
    {
      owner: user?.username!,
    },
    {
      enabled: !!user?.username,
    },
  );

  // trigger initial fetch only if owner is set
  useEffect(() => {
    if (!user?.username) {
      return;
    }
    listAppsQuery.refetch();
  }, [user?.username]);

  useEffect(() => {
    if (!listAppsQuery.data) {
      return;
    }
    setApps(listAppsQuery.data.apps);
  }, [listAppsQuery.data]);

  return (
    <AppsDataProviderContext.Provider
      value={{
        apps,
        isLoading: listAppsQuery.isLoading,
        isFetching: listAppsQuery.isFetching,
        isError: listAppsQuery.isError,
      }}
    >
      {children}
    </AppsDataProviderContext.Provider>
  );
};
