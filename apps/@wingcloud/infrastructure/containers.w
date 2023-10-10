bring cloud;
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
  env: Map<str>?;
  volumes: Map<str>?;
}

struct BindOpts {
  to: str;
  ops: Array<str>;
}

interface IContainer {
  inflight url(): str?;
}

class Container_sim impl IContainer {
  containerName: str;
  appDir: str;
  opts: ContainerOpts;
  bucket: cloud.Bucket;
  urlKey: str;

  init(opts: ContainerOpts) {
    this.containerName = "wing-${opts.name}-${this.node.addr}";

    this.appDir = Container_sim.entrypointDir(this);
    this.opts = opts;
    this.urlKey = "url.txt";
    this.bucket = new cloud.Bucket() as "container-info";

    // readiness probe is only allowed if we have a port (otherwise we don't know what to fetch)
    if opts.readiness? && !opts.port? {
      throw("readiness url requires a port to be specified");
    }
  }

  pub inflight start(opts: ContainerStartOpts?) {
    log("starting container");

    let image = this.opts.image;
    let var tag = image;

    // if this a reference to a local directory, build the image from a docker file
    log("image: ${image}");
    if image.startsWith("./") || image.startsWith("../") || image.startsWith("/") {
      tag = this.containerName;
      
      let shellArgs = MutArray<str>[];
      shellArgs.push("build");
      shellArgs.push("-t");
      shellArgs.push(tag);
      
      if let args = this.opts.args {
        for arg in args.keys() {
          shellArgs.push("--build-arg");
          shellArgs.push("${arg}=${args.get(arg)}");
        }
      }
      
      shellArgs.push(image);
      
      log("building locally from ${image}, tagging ${tag} and args ${shellArgs}...");
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

    args.push("--detach");
    args.push("--name");
    args.push(this.containerName);

    if let port = this.opts.port {
      args.push("-p");
      args.push("${port}");
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

          log("env ${k} ${k}=${value}");
          args.push("-e");
          args.push("${k}=${value}");
        }
      }
    }

    if let volumes = opts?.volumes {
      for volume in volumes.keys() {
        args.push("-v");
        args.push("${volume}:${volumes.get(volume)}");
      }
    }

    args.push(tag);

    Container_sim.shell("docker", ["rm", "-f", this.containerName]);
    Container_sim.shell("docker", args.copy());
    let out = Json.parse(Container_sim.shell("docker", ["inspect", this.containerName]));

    if let port = this.opts.port {
      let hostPort = out.getAt(0).get("NetworkSettings").get("Ports").get("${port}/tcp").getAt(0).get("HostPort");
      let url = "http://localhost:${hostPort.asStr()}";
      log("${this.opts.name}: ${url}");
      this.bucket.put(this.urlKey, url);

      if let readiness = this.opts.readiness {
        let readinessUrl = "${url}${readiness}";
        let success = util.waitUntil(inflight () => {
          log("checking readiness ${readinessUrl}...");
          try {
            let res = http.get(readinessUrl);
            return res.ok;
          } catch {
            return false;
          }
        }, interval: 0.5s, timeout: 2m);
        log("container ${this.opts.name}: status ${success}");
      }
    }
  }

  pub inflight stop() {
    log("stopping container");
    Container_sim.shell("docker", ["rm", "-f", this.containerName]);
  }

  pub inflight url(): str? {
    return this.bucket.tryGet(this.urlKey);
  }
  
  extern "./src/shell.js" static inflight shell(command: str, args: Array<str>, cwd: str?): str;
  extern "./src/shell.js" static entrypointDir(obj: std.IResource): str;
}
