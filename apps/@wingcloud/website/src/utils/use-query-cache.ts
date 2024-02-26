import { useQueryClient } from "@tanstack/react-query";

import type { App, Environment, EnvironmentStatus } from "./wrpc.js";

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

  const deleteAppItemFromAppList = (appId: string) => {
    queryClient.setQueriesData(
      { queryKey: ["app.list"] },
      (apps: { apps: App[] } | undefined) => {
        const newApps = apps?.apps?.filter((app) => app.appId !== appId) || [];
        return { apps: newApps };
      },
    );
    queryClient.setQueriesData(
      { queryKey: ["app.listEnvironments"] },
      (environments: { environments: Environment[] } | undefined) => {
        const newEnvs =
          environments?.environments?.filter((env) => env.appId !== appId) ||
          [];
        return { environments: newEnvs };
      },
    );
  };

  const restartEnvironmentStatus = (branch: string) => {
    queryClient.setQueriesData(
      { queryKey: ["app.environment"] },
      (environment: { environment: Environment } | undefined) => {
        if (environment?.environment.branch === branch) {
          return {
            environment: {
              ...environment.environment,
              status: "initializing" as EnvironmentStatus,
            },
          };
        }
        return environment;
      },
    );
    queryClient.setQueriesData(
      { queryKey: ["app.listEnvironments"] },
      (environments: { environments: Environment[] } | undefined) => {
        const newEnvs =
          environments?.environments?.map((environment) => {
            if (environment.branch === branch) {
              return {
                ...environment,
                status: "initializing" as EnvironmentStatus,
              };
            }
            return environment;
          }) || [];
        return { environments: newEnvs };
      },
    );
  };

  return {
    addAppItemToAppList,
    deleteAppItemFromAppList,
    restartEnvironmentStatus,
  };
};
