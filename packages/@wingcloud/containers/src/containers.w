bring cloud;
bring ex;
bring util;
bring "./containers.fly.w" as fly;
bring "./containers.docker.w" as docker;
bring "./types.w" as types;

struct ContainersProps {
	driver: str?;
}

pub class Containers impl types.IContainers {
  implementation: types.IContainers;

  new(props: ContainersProps?) {
		// let driver = props?.driver ?? util.tryEnv("CONTAINERS_DRIVER") ?? "docker";
		let driver = props?.driver ?? "docker";
		if driver == "docker" {
			this.implementation = new docker.DockerContainers();
		} elif driver == "fly" {
			this.implementation = new fly.FlyContainers(
				token: util.env("CONTAINERS_FLY_TOKEN"),
				orgSlug: util.env("CONTAINERS_FLY_ORG_SLUG"),
				region: util.tryEnv("CONTAINERS_FLY_REGION"),
			);
		} else {
			throw "Unknown CONTAINERS_DRIVER: ${driver}";
		}
  }

  pub inflight create(options: types.CreateContainerOptions): types.Container {
    return this.implementation.create(options);
  }

  pub inflight destroy(containerID: types.ContainerID): void {
    this.implementation.destroy(containerID);
  }
}
