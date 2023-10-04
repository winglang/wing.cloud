bring "./client.w" as client;

struct IAppProps {
  client: client.Client;
  name: str;
}

struct ICreateMachineProps {
  imageName: str;
  region: str?;
  memoryMb: num?;
  env: Map<str>;
  port: num;
}

/**
 * Represent a Fly.io app
 */
inflight class App {
  pub props: IAppProps;
  init(props: IAppProps) {
    this.props = props;
  }

  /**
   * Get the hostname of this app (e.g. app-name.fly.dev).
   */
  pub hostname(): str {
    return "${this.props.name}.fly.dev";
  }

  /**
   * Get the public url of this app (e.g. https://app-name.fly.dev).
   */
  pub url(): str {
    return "https://${this.hostname()}";
  }

  /**
   * Get the app creation date.
   */
  pub createdAt(): std.Datetime {
    let res = this.props.client.getApp(this.props.name);
    return std.Datetime.fromIso(res.data.app.createdAt);
  }

  /**
   * App is ready when all of its machines are in `started` state.
   */
  pub isReady(): bool {
    let res = this.props.client.getApp(this.props.name);

    for node in res.data.app.machines.nodes {
      if node.state != "started" {
        return false;
      }
    }

    return true;
  }

  /**
   * Get id and state for the machines of this app
   */
  pub machinesInfo(): Array<client.IMachineNode> {
    let res = this.props.client.getApp(this.props.name);
    return res.data.app.machines.nodes;
  }

  /**
   * Create a new Fly.io app for this instance.
   */
  pub create() {
    this.props.client.createApp(this.props.name);
    this.props.client.allocateIpAddress(this.props.name);
  }

  /**
   * Delete this Fly.io app.
   */
  pub destroy() {
    this.props.client.deleteApp(this.props.name);
  }

  /**
   * Create a new machine for this app.
   * This will wait for the machine to start.
   */
  pub addMachine(props: ICreateMachineProps): client.ICreateMachineResult {
    let createMachineResult = this.props.client.createMachine({
      appName: this.props.name,
      imageName: props.imageName,
      port: props.port,
      region: props.region,
      memoryMb: props.memoryMb,
      env: props.env,
    });

    this.props.client.waitForMachineState(
      this.props.name,
      createMachineResult,
    );
    return createMachineResult;
  }

  /**
   * Remove a machine from this app.
   */
  pub removeMachine(machineId: str) {
    this.props.client.deleteMachine(this.props.name, machineId);
  }

  /**
   * Update all machines of this app with the given props
   * @param props the props of the new machines
   * @returns machine creation result
   */
  pub update(props: ICreateMachineProps): Array<client.ICreateMachineResult> {
    let info = this.machinesInfo();
    for machine in info {
      this.removeMachine(machine.id);
    }

    let result = MutArray<client.ICreateMachineResult>[];
    for i in 0..info.length {
      result.push(this.addMachine(props));
    }

    return result.copy();
  }

  pub exists(): bool {
    return this.props.client.isAppExists(this.props.name);
  }
}

/**
 * Fly.io apps managment.
 */
 inflight class Fly {
  client: client.Client;
  init(client: client.Client) {
    this.client = client;
  }

  pub app(name: str): App {
    return new App(name: name, client: this.client);
  }

  pub listApps(): Array<App> {
    let res = this.client.apps();
    // const res = await this.client.apps();
    let apps = MutArray<App>[];
    for app in res.data.apps.nodes {
      apps.push(new App(client: this.client, name: app.id));
    }
    return apps.copy();
  }
}
