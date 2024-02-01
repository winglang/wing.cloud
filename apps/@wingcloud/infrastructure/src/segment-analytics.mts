import { Analytics } from "@segment/analytics-node";

interface SegmentAnalyticsOptions {
  writeKey: string;
}

export const createSegmentAnalytics = async ({
  writeKey,
}: SegmentAnalyticsOptions) => {
  const analytics = new Analytics({ writeKey });
  return {
    async track(options: any) {
      await new Promise((resolve) => analytics.track(options, resolve));
    },
    async identify(options: any) {
      await new Promise((resolve) => analytics.identify(options, resolve));
    },
  };
};

export const normilizeEventName = (event: string): string => {
  return event.toLowerCase().replaceAll(/\s/g, "");
};
