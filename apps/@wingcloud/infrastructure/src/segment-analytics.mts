import {Analytics} from "@segment/analytics-node";

interface SegmentAnalyticsOptions {
    writeKey: string;
}

export const createSegmentAnalytics = ({writeKey}: SegmentAnalyticsOptions): Analytics => {
    return new Analytics({writeKey});
}

export const normilizeEventName = (event: string): string => {
    return event.toLowerCase().replaceAll(/\s/g, "")
}
