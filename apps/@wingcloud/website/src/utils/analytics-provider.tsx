import { AnalyticsBrowser } from "@segment/analytics-next";
import { createContext, type PropsWithChildren, useEffect } from "react";

import { useGetPathDetails } from "./use-get-path-details.js";

// @ts-ignore - this is a winglang hack
const SEGMENT_WRITE_KEY = window.wingEnv?.SEGMENT_WRITE_KEY;
// @ts-ignore - this is a winglang hack
const ENABLE_ANALYTICS = window.wingEnv?.ENABLE_ANALYTICS;

const MockAnalytics = {
  track: (
    eventName: string,
    options?: Record<string, any>,
    integrations?: Record<string, any>,
  ) => {
    console.debug("Analytics.track", eventName, options, integrations);
  },
  identify: (id: string, traits: Record<string, any>) => {
    console.debug("Analytics.identify", id, traits);
  },
  page: () => {},
};

let instance = MockAnalytics;
if (ENABLE_ANALYTICS === "true") {
  instance = AnalyticsBrowser.load({
    writeKey: SEGMENT_WRITE_KEY,
  });
}

export interface UserIdentity {
  id: string;
  name: string;
  email: string;
}

export interface AnalyticsProps {}

const MAX_ANALYTICS_STRING_LENGTH = 1024;

const sessionId = Date.now();

let identified = false;

const setIdentity = (identity: UserIdentity) => {
  if (!identified) {
    instance.identify(identity.id, {
      name: identity.name,
      email: identity.email,
    });
    identified = true;
  }
};

const track = (event: string, properties?: Record<string, any>) => {
  if (!identified) {
    console.debug("user not identified, ignoring analytics event");
  }
  instance.track(event.toLowerCase().replaceAll(/\s/g, ""), {
    ...properties,
    integrations: {
      "Actions Amplitude": {
        session_id: sessionId,
      },
    },
  });
};

function useAnalytics() {
  const { getApp, getEnv } = useGetPathDetails();
  useEffect(() => {
    instance.page();
  }, []);

  useEffect(() => {
    const listener = (event: any) => {
      //todo get the app name ana branch from the URL

      if (event && event.data && event.data.trace) {
        const trace = event.data.trace;
        if (trace.type !== "resource") {
          return;
        }

        const resourceName = trace.sourceType.replace("wingsdk.cloud.", "");
        if (!trace.data.message.includes("(")) {
          return;
        }

        // extracting the action name.
        // trace message for resources looks like this:
        // 'Invoke (payload="{\\"messages\\":[\\"dfd\\"]}").'
        const action = trace.data.message.slice(
          0,
          Math.max(0, trace.data.message.indexOf("(")),
        );

        const properties = {
          message:
            trace?.data?.message?.slice(
              0,
              Math.max(0, MAX_ANALYTICS_STRING_LENGTH),
            ) || "",
          status:
            trace?.data?.status?.slice(
              0,
              Math.max(0, MAX_ANALYTICS_STRING_LENGTH),
            ) || "unknown",
          result:
            trace?.data?.result?.slice(
              0,
              Math.max(0, MAX_ANALYTICS_STRING_LENGTH),
            ) || "unknown",
        };

        // general interaction event
        const eventName = `cloud_resource_interact`;
        track(eventName, {
          resource: resourceName,
          action,
          ...properties,
          branch: getEnv(),
          repo: getApp(),
        });
      }
    };

    window.addEventListener("message", listener);

    return () => {
      window.removeEventListener("message", listener);
    };
  }, []);

  return {
    track,
    setIdentity,
  };
}

export interface AnalyticsContext {
  track: (event: string, properties?: Record<string, any>) => void;
  setIdentity: (identity: UserIdentity) => void;
}

export const AnalyticsContext = createContext<AnalyticsContext>({
  track: () => {},
  setIdentity: () => {},
});

export const AnalyticsProvider = ({
  children,
}: AnalyticsProps & PropsWithChildren) => {
  const { track, setIdentity } = useAnalytics();

  return (
    <AnalyticsContext.Provider value={{ track, setIdentity }}>
      {children}
    </AnalyticsContext.Provider>
  );
};
