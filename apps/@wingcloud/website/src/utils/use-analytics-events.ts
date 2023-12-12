import { useGetPathDetails } from "./use-get-path-details.js";

export interface UseAnalyticsEventsOptions {
  track: (event: string, properties?: Record<string, any>) => void;
}

export const useAnalyticsEvents = ({ track }: UseAnalyticsEventsOptions) => {
  const { getApp } = useGetPathDetails();
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
      //TODO: add when we will have a websocket support for receiving a new environment creation event.
      //case "app.listEnvironments": {}
      default: {
        console.debug("analytics events: unknown event", event, options);
      }
    }
  };

  return {
    handleEvent,
  };
};
