bring "./client.w" as client;

struct IAppProps {
  client: client.Client;
  name: str;
}

pub struct ICreateMachineProps {
  imageName: str;
  region: str?;
  memoryMb: num?;
  env: Map<str>;
  services: Array<client.IClientCreateMachineService>;
  files: Array<client.File>?;
  mounts: Array<client.Mount>?;
}

pub struct ICreateVolumeProps {
  name: str;
  region: str;
  size: num;
}

/**
 * Represent a Fly.io app
 */
inflight class FlyApp {
  pub props: IAppProps;
  new(props: IAppProps) {
    this.props = props;
  }

  /**
   * Get the hostname of this app (e.g. app-name.fly.dev).
   */
  pub hostname(): str {
    return "{this.props.name}.fly.dev";
  }

  /**
   * Get the public url of this app (e.g. https://app-name.fly.dev).
   */
  pub url(): str {
    return "https://{this.hostname()}";
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
      region: props.region,
      memoryMb: props.memoryMb,
      env: props.env,
      files: props.files,
      mounts: props.mounts,
      services: props.services,
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

  pub addSecrets(secrets: Map<str>) {
    this.props.client.createSecrets(this.props.name, secrets);
  }

  pub addVolume(props: ICreateVolumeProps): client.IClientVolume {
    return this.props.client.createVolume(
      appName: this.props.name,
      name: props.name,
      region: props.region,
      size: props.size);
  }

  pub listVolumes(): Array<client.IClientVolume> {
    return this.props.client.listVolumes(this.props.name);
  }
}

/**
 * Fly.io apps managment.
 */
 pub inflight class Fly {
  client: client.Client;
  new(client: client.Client) {
    this.client = client;
  }

  pub app(name: str): FlyApp {
    return new FlyApp(name: name, client: this.client);
  }

  pub listApps(): Array<FlyApp> {
    let queryApps = (cursor: str, apps: MutArray<FlyApp>): client.IClientPageInfo => {
      let res = this.client.apps(cursor);
      for app in res.data.apps.nodes {
        apps.push(new FlyApp(client: this.client, name: app.id));
      }
      return res.data.apps.pageInfo;
    };

    let apps = MutArray<FlyApp>[];
    let var cursor = "";
    while (true) {
      let pageInfo = queryApps(cursor, apps);
      if !pageInfo.hasNextPage {
        break;
      }
      cursor = pageInfo.endCursor;
    }
  
    return apps.copy();
  }
}
