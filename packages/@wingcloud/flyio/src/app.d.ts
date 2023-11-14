import { FlyClient, ICreateMachineResult } from "./client.js";
export interface IAppProps {
    readonly client: FlyClient;
    readonly name: string;
}
export interface ICreateMachineProps {
    readonly imageName: string;
    readonly region?: string;
    readonly memoryMb?: number;
    readonly env: Record<string, string>;
    readonly port: number;
}
/**
 * Fly.io apps managment.
 */
export declare class Fly {
    private client;
    constructor(client: FlyClient);
    app(name: string): App;
    listApps(): Promise<App[]>;
}
/**
 * Represent a Fly.io app
 */
export declare class App {
    props: IAppProps;
    constructor(props: IAppProps);
    /**
     * Get the hostname of this app (e.g. app-name.fly.dev).
     */
    hostname(): string;
    /**
     * Get the public url of this app (e.g. https://app-name.fly.dev).
     */
    url(): string;
    /**
     * Get the app creation date.
     */
    createdAt(): Promise<Date>;
    /**
     * App is ready when all of its machines are in `started` state.
     */
    isReady(): Promise<boolean>;
    /**
     * Get id and state for the machines of this app
     */
    machinesInfo(): Promise<import("./client.js").IMachineNode[]>;
    /**
     * Create a new Fly.io app for this instance.
     */
    create(): Promise<void>;
    /**
     * Delete this Fly.io app.
     */
    destroy(): Promise<void>;
    /**
     * Create a new machine for this app.
     * By default this will wait for the machine to start.
     * @param [wait=true] wait for the the machine to reach status `started`.
     */
    addMachine(props: ICreateMachineProps, wait?: boolean): Promise<ICreateMachineResult>;
    /**
     * Remove a machine from this app.
     */
    removeMachine(machineId: string): Promise<void>;
    /**
     * Update all machines of this app with the given props
     * @param props the props of the new machines
     * @returns machine creation result
     */
    update(props: ICreateMachineProps): Promise<ICreateMachineResult[]>;
}
