pub struct ContainerID {
    value: str;
}

pub struct Container {
    containerID: ContainerID;
    url: str;
}

pub struct CreateContainerOptions {
    image: str;
	port: num;
	readiness: str?;
	env: Map<str>?;
}

pub interface IContainers {
    inflight create(options: CreateContainerOptions): Container;
    inflight destroy(containerID: ContainerID): void;
}
