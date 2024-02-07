import { useQueryClient } from "@tanstack/react-query";

import type { App } from "./wrpc.js";

export const useQueryCache = () => {
  const queryClient = useQueryClient();

  const addAppItemToAppList = (app: App) => {
    queryClient.setQueriesData(
      { queryKey: ["app.list"] },
      (apps: { apps: App[] } | undefined) => {
        const newApps = apps?.apps ? [...apps.apps, app] : [app];
        return { apps: newApps };
      },
    );
  };

  const deleteAppItemFromAppList = (appNameToRemove: string) => {
    queryClient.setQueriesData(
      { queryKey: ["app.list"] },
      (apps: { apps: App[] } | undefined) => {
        const newApps =
          apps?.apps?.filter((app) => app.appName !== appNameToRemove) || [];
        return { apps: newApps };
      },
    );
  };

  return {
    addAppItemToAppList,
    deleteAppItemFromAppList,
  };
};
