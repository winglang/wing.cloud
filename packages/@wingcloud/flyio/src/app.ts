import { FlyClient, ICreateMachineResult } from "./client";

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
export class Fly {
  constructor(private client: FlyClient) {}
  public app(name: string) {
    return new App({ name, client: this.client });
  }

  public async listApps() {
    const res = await this.client.apps();
    const apps = [];
    for (let app of res.data.apps.nodes) {
      apps.push(new App({ client: this.client, name: app.id }));
    }
    return apps;
  }
}

/**
 * Represent a Fly.io app
 */
export class App {
  constructor(public props: IAppProps) {

  }

  /**
   * Get the hostname of this app (e.g. app-name.fly.dev).
   */
  public hostname(): string {
    return `${this.props.name}.fly.dev`;
  }

  /**
   * Get the public url of this app (e.g. https://app-name.fly.dev).
   */
  public url(): string {
    return `https://${this.hostname()}`;
  }

  /**
   * Get the app creation date.
   */
  public async createdAt() {
    const res = await this.props.client.getApp(this.props.name);
    return new Date(res.data.app.createdAt);
  }

  /**
   * App is ready when all of its machines are in `started` state.
   */
  public async isReady() {
    const res = await this.props.client.getApp(this.props.name);
    return res.data.app.machines.nodes.every(n => n.state === "started");
  }

  /**
   * Get id and state for the machines of this app
   */
  public async machinesInfo() {
    const res = await this.props.client.getApp(this.props.name);
    return res.data.app.machines.nodes;
  }

  /**
   * Create a new Fly.io app for this instance.
   */
  public async create() {
    await this.props.client.createApp(this.props.name);
    await this.props.client.allocateIpAddress(this.props.name);
  }

  /**
   * Delete this Fly.io app.
   */
  public async destroy() {
    return this.props.client.deleteApp(this.props.name);
  }

  /**
   * Create a new machine for this app.
   * By default this will wait for the machine to start.
   * @param [wait=true] wait for the the machine to reach status `started`.
   */
  public async addMachine(props: ICreateMachineProps, wait: boolean = true) {
    const createMachineResult = await this.props.client.createMachine({
      appName: this.props.name,
      imageName: props.imageName,
      port: props.port,
      region: props.region,
      memoryMb: props.memoryMb,
      env: props.env,
    });
    if (wait) {
      await this.props.client.waitForMachineState(this.props.name, createMachineResult);
    }
    return createMachineResult;
  }

  /**
   * Remove a machine from this app.
   */
  public async removeMachine(machineId: string) {
    return this.props.client.deleteMachine(this.props.name, machineId);
  }

  /**
   * Update all machines of this app with the given props
   * @param props the props of the new machines
   * @returns machine creation result
   */
  public async update(props: ICreateMachineProps) {
    const info = await this.machinesInfo();
    for (let machine of info) {
      await this.removeMachine(machine.id);
    }

    const result: ICreateMachineResult[] = [];
    for (let i = 0; i < info.length; i++) {
      result.push(await this.addMachine(props));
    }

    return result;
  }
}
