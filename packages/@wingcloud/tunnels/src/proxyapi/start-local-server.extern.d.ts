export default interface extern {
  startServer: (handler: (arg0: ProxyApiEvent) => Promise<ProxyApiResponse>) => Promise<StartServerResult$Inflight>,
}
export interface ProxyApiEvent {
  readonly body?: (string) | undefined;
  readonly headers?: (Readonly<Record<string, string>>) | undefined;
  readonly httpMethod: string;
  readonly isBase64Encoded: boolean;
  readonly path: string;
  readonly queryStringParameters?: (Readonly<Record<string, string>>) | undefined;
  readonly subdomain: string;
}
export interface ProxyApiResponse {
  readonly body?: (string) | undefined;
  readonly headers?: (Readonly<Record<string, string>>) | undefined;
  readonly statusCode: number;
}
export interface StartServerResult$Inflight {
  readonly close: () => Promise<void>;
  readonly port: () => Promise<number>;
}