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
interface Analytics {
    inflight track (SegmentTrackOptions): void;
}

inflight class MockSegmentAnalytics impl Analytics {
    pub inflight track (options: SegmentTrackOptions) {
        log("MockSegmentAnalytics.track: {Json.stringify(options)}");
    }
}

pub class SegmentAnalytics {
    extern "./src/segment-analytics.mts" pub inflight static createSegmentAnalytics(options: SegmentAnalyticsOptions): Analytics;
    extern "./src/segment-analytics.mts" pub inflight static normilizeEventName(event: str): str;
   
    writeKey: str;
    enabled: bool;
    inflight var analytics: Analytics;
    inflight var session: str;

    new (writeKey: str, enabled: bool) {
        this.writeKey = writeKey;
        this.enabled = enabled;
    }

    inflight new () {
        if(this.enabled){
            this.analytics = SegmentAnalytics.createSegmentAnalytics({
                writeKey: this.writeKey
            });
        } else {
            this.analytics = new MockSegmentAnalytics();
        }
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