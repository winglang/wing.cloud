export default interface extern {
  startServer: () => Promise<SimDNSProxyResult>,
}
export interface SimDNSProxyResult {
  readonly port: number;
}