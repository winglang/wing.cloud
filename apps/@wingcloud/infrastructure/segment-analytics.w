struct SegmentTrackOptions {
    event: str;
    properties: Json?;
    integrations: Json?;
}
struct Analytics {
    track: inflight (SegmentTrackOptions): void;
}
pub class SegmentAnalytics {
    extern "./src/segment-analytics.mts" pub static createSegmentAnalytics(writeKey: str): Analytics;
    extern "./src/segment-analytics.mts" pub inflight static normilizeEventName(event: str): str;

    analytics: Analytics;
    session: str;

    new (writeKey: str) {
        this.analytics = SegmentAnalytics.createSegmentAnalytics(writeKey);
        this.session = datetime.utcNow().toIso();
    }

    pub inflight track(event: str, properties: Json) {
        this.analytics.track({
            event: SegmentAnalytics.normilizeEventName(event),
            properties: properties,
            integrations: {
                "Actions Amplitude": {
                    session_id: this.session,
                },
            },
        });
    }
}