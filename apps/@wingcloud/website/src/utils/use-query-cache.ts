import { useQueryClient } from "@tanstack/react-query";

import type { App, Environment, EnvironmentStatus, Secret } from "./wrpc.js";

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

  const restartAppEnvironmentsStatus = (appId: string) => {
    queryClient.setQueriesData(
      { queryKey: ["app.list"] },
      (apps: { apps: App[] } | undefined) => {
        const newApps =
          apps?.apps?.map((app) => {
            if (app.appId === appId) {
              return { ...app, status: "initializing" as EnvironmentStatus };
            }
            return app;
          }) || [];
        return { apps: newApps };
      },
    );

    queryClient.setQueriesData(
      { queryKey: ["app.listEnvironments"] },
      (environments: { environments: Environment[] } | undefined) => {
        const newEnvs =
          environments?.environments?.map((env) => {
            if (env.appId === appId) {
              return { ...env, status: "initializing" as EnvironmentStatus };
            }
            return env;
          }) || [];
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

  const addSecretItemToSecretList = (secret: Secret) => {
    queryClient.setQueriesData(
      { queryKey: ["app.listSecrets"] },
      (secrets: { secrets: Secret[] } | undefined) => {
        const newSecrets = secrets?.secrets
          ? [...secrets.secrets, secret]
          : [secret];
        return { secrets: newSecrets };
      },
    );
  };

  const deleteSecretItemFromSecretList = (secretId: string) => {
    queryClient.setQueriesData(
      { queryKey: ["app.listSecrets"] },
      (secrets: { secrets: Secret[] } | undefined) => {
        const newSecrets =
          secrets?.secrets?.filter((secret) => secret.id !== secretId) || [];
        return { secrets: newSecrets };
      },
    );
  };

  return {
    addAppItemToAppList,
    restartAppEnvironmentsStatus,
    deleteAppItemFromAppList,
    restartEnvironmentStatus,
    addSecretItemToSecretList,
    deleteSecretItemFromSecretList,
  };
};
