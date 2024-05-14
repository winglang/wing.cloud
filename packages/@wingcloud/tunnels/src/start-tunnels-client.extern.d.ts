export default interface extern {
  startTunnelsClient: (port: string, subdomain: string, hostname: string, wsServer: string) => Promise<IStartTunnelsClientResult$Inflight>,
}
export interface IStartTunnelsClientResult$Inflight {
  readonly close: () => Promise<void>;
}