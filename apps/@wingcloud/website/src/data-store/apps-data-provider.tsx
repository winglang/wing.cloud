import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";

import type { App } from "../utils/wrpc.js";
import { wrpc } from "../utils/wrpc.js";

export interface AppsDataProviderContext {
  apps: App[];
  isLoading: boolean;
  isError: boolean;
}
const DEFAULT_CONTEXT: AppsDataProviderContext = {
  apps: [],
  isLoading: true,
  isError: false,
};
export const AppsDataProviderContext =
  createContext<AppsDataProviderContext>(DEFAULT_CONTEXT);

export const AppsDataProvider = ({ children }: PropsWithChildren) => {
  const [apps, setApps] = useState<App[]>([]);
  const user = wrpc["auth.check"].useQuery(undefined, {
    throwOnError: false,
    retry: false,
  });
  const listAppsQuery = wrpc["app.list"].useQuery(
    {
      owner: user?.data?.user.username!,
    },
    {
      enabled: !!user?.data?.user.username,
    },
  );

  // trigger initial fetch only if owner is set
  useEffect(() => {
    if (!user?.data?.user.username) {
      return;
    }
    listAppsQuery.refetch();
  }, [user?.data?.user.username]);

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
        isError: listAppsQuery.isError,
      }}
    >
      {children}
    </AppsDataProviderContext.Provider>
  );
};
