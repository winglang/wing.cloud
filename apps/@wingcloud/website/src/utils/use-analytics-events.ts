import { useGetPathDetails } from "./use-get-path-details.js";

export interface UseAnalyticsEventsOptions {
  track: (event: string, properties?: Record<string, any>) => void;
}

export const useAnalyticsEvents = ({ track }: UseAnalyticsEventsOptions) => {
  const { getOwner, getEnv, getApp } = useGetPathDetails();
  const handleEvent = (event: string, options?: Record<string, any>) => {
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
      //TODO: case: "environment.create"

      default: {
        console.debug("analytics events: unknown event", event, options);
      }
    }
  };

  return {
    handleEvent,
  };
};
