struct SegmentTrackOptions {
    userId: str;
    event: str;
    properties: Json?;
    integrations: Json?;
}
struct SegmentIdentity {
    userId: str;
    traits: Json?;
}
struct SegmentAnalyticsOptions {
    writeKey: str;
}
struct Analytics {
    track: inflight (SegmentTrackOptions): void;
}
pub class SegmentAnalytics {
    extern "./src/segment-analytics.mts" pub inflight static createSegmentAnalytics(options: SegmentAnalyticsOptions): Analytics;
    extern "./src/segment-analytics.mts" pub inflight static normilizeEventName(event: str): str;
   
    writeKey: str;
    inflight var analytics: Analytics;
    inflight var session: str;

    new (writeKey: str) {
        this.writeKey = writeKey;
    }

    inflight new () {
        this.analytics = SegmentAnalytics.createSegmentAnalytics({
            writeKey: this.writeKey
        });
        this.session = datetime.utcNow().toIso();
    }

    pub inflight track(userId: str, event: str, properties: Json) {
        this.analytics.track({
            userId: userId,
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