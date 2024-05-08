export default interface extern {
  createSegmentAnalytics: (options: SegmentAnalyticsOptions) => Promise<Analytics$Inflight>,
  normilizeEventName: (event: string) => Promise<string>,
}
export interface SegmentAnalyticsOptions {
  readonly writeKey: string;
}
export interface SegmentIdentifyOptions {
  readonly anonymousId: string;
  readonly traits?: (Readonly<any>) | undefined;
  readonly userId?: (string) | undefined;
}
export interface SegmentTrackOptions {
  readonly anonymousId?: (string) | undefined;
  readonly event: string;
  readonly integrations?: (Readonly<any>) | undefined;
  readonly properties?: (Readonly<any>) | undefined;
  readonly userId?: (string) | undefined;
}
export interface Analytics$Inflight {
  readonly identify: (options: SegmentIdentifyOptions) => Promise<void>;
  readonly track: (options: SegmentTrackOptions) => Promise<void>;
}