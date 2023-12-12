import { useGetPathDetails } from "./use-get-path-details.js";

export interface UseAnalyticsEventsOptions {
  track: (event: string, properties?: Record<string, any>) => void;
}

interface Environment {
  branch: string;
  type: string;
}
// TODO: remove when we will have a websocket support for receiving a new environment creation event
const repoEnvironments: Record<string, Environment[]> = {};
const syncRepoEnvironments = (
  repo: string,
  environments: Environment[],
): Environment[] => {
  if (!repo) {
    return [];
  }
  const previousEnvironments = repoEnvironments[repo] || [];
  const newEnvironments = environments.filter((environment) => {
    for (const previousEnvironment of previousEnvironments) {
      if (
        previousEnvironment.branch === environment.branch &&
        previousEnvironment.type === environment.type
      ) {
        return false;
      }
    }
    return true;
  });
  repoEnvironments[repo] = environments;
  return newEnvironments;
};

export const useAnalyticsEvents = ({ track }: UseAnalyticsEventsOptions) => {
  const { getOwner, getEnv, getApp } = useGetPathDetails();
  const handleEvent = (
    event: string,
    options?: Record<string, any>,
    data?: any,
  ) => {
    switch (event) {
      case "app.create": {
        if (!options) {
          return;
        }
        track("cloud_app_added", { repo: options["repoName"] });
        break;
      }
      case "app.createSecret": {
        if (!options) {
          return;
        }
        track("cloud_secret_added", {
          name: options["name"],
          repo: getApp(),
        });
      }
      case "app.listEnvironments": {
        if (!options || !data || !data.environments) {
          return;
        }
        const newEnvironments = syncRepoEnvironments(
          getApp(),
          data.environments.map((environment: Environment) => ({
            branch: environment.branch,
            type: environment.type,
          })),
        );
        for (const environment of newEnvironments) {
          track("cloud_environment_created", {
            repo: getApp(),
            environment,
          });
        }
        return;
      }
      default: {
        console.debug("analytics events: unknown event", event, options);
      }
    }
  };

  return {
    handleEvent,
  };
};
