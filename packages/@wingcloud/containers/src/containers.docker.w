bring cloud;
bring ex;
bring util;
bring http;
bring "../../nanoid/src/nanoid.w" as nanoid;
bring "./types.w" as types;

pub class DockerContainers impl types.IContainers {
  extern "./containers.docker.js" static inflight exec(command: str, args: Array<str>, cwd: str?): str;

  containers: ex.Table;

  new() {
    if util.env("WING_TARGET") != "sim" {
      throw "DockerContainers is only available in target [sim]";
    }

    this.containers = new ex.Table(
      name: "containers",
      primaryKey: "containerID",
      columns: {
        "containerID": ex.ColumnType.STRING,
        "url": ex.ColumnType.STRING,
      },
    );

    new cloud.Service(inflight () => {
      return () => {
        for container in this.containers.list() {
          let containerID = types.ContainerID {
            value: container.get("containerID").asStr(),
          };
          this.destroy(containerID);
        }
      };
    });
  }

  pub inflight create(options: types.CreateContainerOptions): types.Container {
    let containerID = types.ContainerID {
      value: nanoid.Nanoid.nanoid36(),
    };

    let args = MutArray<str>["run"];
    args.push("--detach");
    args.push("--publish");
    args.push("{options.port}");
    args.push("--name");
    args.push(containerID.value);
    if let env = options?.env {
      for key in env.keys() {
        let var value = env.get(key);
        if value.contains("http://localhost") {
          value = value.replace("http://localhost", "http://host.docker.internal");
        } elif value.contains("http://127.0.0.1") {
          value = value.replace("http://127.0.0.1", "http://host.docker.internal");
        }

        args.push("--env");
        args.push("{key}={value}");
      }
    }
    args.push(options.image);
    DockerContainers.exec(
      "docker",
      args.copy(),
    );

    let containerURL = this.findContainerURL(containerID, options.port);

    if let readiness = options.readiness {
      let readinessURL = "{containerURL}{readiness}";
      let success = util.waitUntil(inflight () => {
        try {
          let response = http.get(readinessURL);
          return response.ok;
        } catch {
          return false;
        }
      }, interval: 0.5s, timeout: 2m);
      if !success {
        throw "Container [{containerID.value}] failed readiness check [{readinessURL}]";
      }
    }

    this.containers.insert(containerID.value, {
      containerID: containerID.value,
      url: containerURL,
    });

    return {
      containerID: containerID,
      url: containerURL,
    };
  }

  inflight findHostPort(containerID: types.ContainerID, port: num): str {
    let inspectResult = Json.parse(DockerContainers.exec("docker", ["inspect", containerID.value]));
    if let port = inspectResult.tryGetAt(0)?.tryGet("NetworkSettings")?.tryGet("Ports")?.tryGet("{port}/tcp")?.tryGetAt(0)?.tryGet("HostPort") {
      return port.asStr();
    } else {
      throw "Unable to find port [{port}] for container [{containerID.value}]";
    }
  }

  inflight findContainerURL(containerID: types.ContainerID, port: num): str {
    let hostPort = this.findHostPort(containerID, port);
    return "http://localhost:{hostPort}";
  }

  pub inflight destroy(containerID: types.ContainerID): void {
    DockerContainers.exec("docker", ["rm", "-f", containerID.value]);
  }
}
