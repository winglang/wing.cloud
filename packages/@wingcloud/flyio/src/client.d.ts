export interface IClientCreateMachineProps {
    appName: string;
    imageName: string;
    port: number;
    region?: string;
    memoryMb?: number;
    env?: Record<string, string>;
}
export interface IMachineNode {
    readonly id: string;
    readonly instanceId: string;
    readonly state: string;
}
export interface IAppMachines {
    readonly nodes: IMachineNode[];
    readonly totalCount: number;
}
export interface IApp {
    readonly id: string;
    readonly createdAt: string;
    readonly machines: IAppMachines;
}
export interface IGetAppResultDataApps {
    readonly nodes: IApp[];
    readonly totalCount: number;
}
export interface IGetAppResultData {
    readonly apps: IGetAppResultDataApps;
}
export interface IAppsResult {
    readonly data: IGetAppResultData;
}
export interface ICountResultDataApps {
    readonly totalCount: number;
}
export interface ICountResultData {
    readonly apps: ICountResultDataApps;
}
export interface ICountResult {
    readonly data: ICountResultData;
}
export interface ICreateMachineResult {
    readonly id: string;
    readonly instanceId: string;
}
export interface IGetAppResultDataApp {
    readonly app: IApp;
}
export interface IGetAppResult {
    readonly data: IGetAppResultDataApp;
}
export declare class FlyClient {
    token: string;
    graphqlUrl: string;
    apiUrl: string;
    /**
     *
     * @param token Fly.io api token. Optional.
     * By default will use the `FLY_API_TOKEN` env var.
     */
    constructor(token?: string);
    /**
     * @internal
     */
    _headers(): {
        Authorization: string;
        "Content-Type": string;
    };
    apps(): Promise<IAppsResult>;
    appsCount(): Promise<number>;
    createApp(appName: string): Promise<void>;
    deleteApp(appName: string): Promise<void>;
    allocateIpAddress(appName: string): Promise<void>;
    createMachine({ appName, imageName, port, region, memoryMb, env, }: IClientCreateMachineProps): Promise<ICreateMachineResult>;
    deleteMachine(appName: string, id: string): Promise<void>;
    waitForMachineState(appName: string, machineResult: ICreateMachineResult): Promise<void>;
    getApp(appName: string): Promise<IGetAppResult>;
}
