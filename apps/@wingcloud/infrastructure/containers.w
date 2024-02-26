bring cloud;
bring ex;
bring http;
bring util;

struct ContainerOpts {
  name: str;
  image: str;
  port: num?;
  privileged: bool?;
  args: Map<str>?;
  readiness: str?; // http get
}

struct ContainerStartOpts {
  name: str;
  env: Map<str>?;
  volumes: Map<str>?;
}

struct ContainerStopOpts {
  name: str;
}

struct BindOpts {
  to: str;
  ops: Array<str>;
}

pub class Container_sim {
  containerNameBase: str;
  appDir: str;
  opts: ContainerOpts;
  table: ex.Table;
  urlKey: str;

  new(opts: ContainerOpts) {
    this.containerNameBase = "wing-{opts.name}-{this.node.addr}";

    this.appDir = Container_sim.entrypointDir(this);
    this.opts = opts;
    this.urlKey = "url.txt";
    this.table = new ex.Table(name: "containers", primaryKey: "name", columns: {
      "name" => ex.ColumnType.STRING
    }) as "container-info";

    // readiness probe is only allowed if we have a port (otherwise we don't know what to fetch)
    if opts.readiness? && !opts.port? {
      throw("readiness url requires a port to be specified");
    }
  }

  pub inflight start(opts: ContainerStartOpts): str? {
    log("starting container");

    let image = this.opts.image;
    let var tag = image;

    // if this a reference to a local directory, build the image from a docker file
    log("image: {image}");
    if image.startsWith("./") || image.startsWith("../") || image.startsWith("/") {
      tag = this.containerNameBase;

      let shellArgs = MutArray<str>[];
      shellArgs.push("build");
      shellArgs.push("-t");
      shellArgs.push(tag);

      if let args = this.opts.args {
        for arg in args.keys() {
          shellArgs.push("--build-arg");
          shellArgs.push("{arg}={args.get(arg)}");
        }
      }

      shellArgs.push(image);

      log("building locally from {image}, tagging {tag} and args {shellArgs}...");
      Container_sim.shell("docker", shellArgs.copy(), this.appDir);
    } else {
      Container_sim.shell("docker", ["pull", this.opts.image]);
    }

    let args = MutArray<str>[];
    args.push("run");

    if let privileged = this.opts.privileged {
      if privileged {
        args.push("--privileged");
      }
    }

    let containerName = "{this.containerNameBase}-{util.sha256(opts.name).substring(0, 8)}";
    args.push("--detach");
    args.push("--name");
    args.push(containerName);

    if let port = this.opts.port {
      args.push("-p");
      args.push("{port}");
    }

    if let env = opts?.env {
      if env.size() > 0 {
        for k in env.keys() {
          let var value = env.get(k);
          if value.contains("http://localhost") {
            value = value.replace("http://localhost", "http://host.docker.internal");
          } elif value.contains("http://127.0.0.1") {
            value = value.replace("http://127.0.0.1", "http://host.docker.internal");
          }

          log("env {k} {k}={value}");
          args.push("-e");
          args.push("{k}={value}");
        }
      }
    }

    if let volumes = opts?.volumes {
      for volume in volumes.keys() {
        args.push("-v");
        args.push("{volume}:{volumes.get(volume)}");
      }
    }

    args.push(tag);

    this.stopContainer(containerName);
    Container_sim.shell("docker", args.copy());
    let out = Json.parse(Container_sim.shell("docker", ["inspect", containerName]));

    if let port = this.opts.port {
      let hostPort = out.getAt(0).get("NetworkSettings").get("Ports").get("{port}/tcp").getAt(0).get("HostPort");
      let url = "http://localhost:{hostPort.asStr()}";
      log("container {containerName}: {url}");
      this.table.upsert(containerName, { name: containerName });

      if let readiness = this.opts.readiness {
        let readinessUrl = "{url}{readiness}";
        let success = util.waitUntil(inflight () => {
          log("checking readiness {readinessUrl}...");
          try {
            let res = http.get(readinessUrl);
            return res.ok;
          } catch {
            return false;
          }
        }, interval: 0.5s, timeout: 2m);
        log("container {this.opts.name}: status {success}");
      }

      return url;
    } else {
      return nil;
    }
  }

  pub inflight stop(options: ContainerStopOpts) {
    let containerName = "{this.containerNameBase}-{util.sha256(options.name).substring(0, 8)}";
    this.stopContainer(containerName);
  }

  pub inflight stopAll() {
    log("stopping all containers");
    for container in this.table.list() {
      this.stopContainer(container.get("name").asStr());
    }
  }

  inflight stopContainer(containerName: str) {
    // seng SIGINT and remove container
    log("stopping container {containerName}");

    try {
      Container_sim.shell("docker", ["kill", "--signal=2", containerName]);
      this.table.delete(containerName);
    } catch err {
      log("stopContainer (kill): {err}");
    }

    try {
     Container_sim.shell("docker", ["rm", "-f", containerName]);
    } catch err {
      log("stopContainer (rm): {err}");
    }
  }

  extern "./src/shell.js" static inflight shell(command: str, args: Array<str>, cwd: str?): str;
  extern "./src/shell.js" static entrypointDir(obj: std.IResource): str;
}
