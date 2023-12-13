import Analytics from "@segment/analytics-node";

interface SegmentAnalyticsOptions {
    writeKey: string;
    identity?: {
        userId: string;
        traits: {
            name: string;
        }
    }
}

export const createSegmentAnalytics = ({writeKey, identity}: SegmentAnalyticsOptions): Analytics => {
    const analytics = new Analytics({writeKey});
    if (identity){
        analytics.identify(identity);
    }
    return analytics;
}

export const normilizeEventName = (event: string): string => {
    return event.toLowerCase().replaceAll(/\s/g, "")
}
