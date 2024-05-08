export default interface extern {
  startReverseProxyServer: (props: ReverseProxyServerProps) => Promise<SimReverseProxyResult>,
}
export interface Origin {
  readonly domainName: string;
  readonly pathPattern: string;
}
export interface ReverseProxyServerProps {
  readonly origins: (readonly (Origin)[]);
  readonly port?: (number) | undefined;
}
export interface SimReverseProxyResult {
  readonly port: number;
}