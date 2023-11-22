bring cloud;
bring util;
bring sim;
bring "./node_modules/@wingcloud/simutils/index.w" as simutils;

class Table {
  pub url: str;

  new() {
    let state = new sim.State();
    this.url = state.token("url");

    // let port = new simutils.Port();
    // new cloud.Service(inflight () => {
    //   state.set("url", "http://localhost:${port.port}");
    // });

    let containerName = "wingcloud--${Table.replaceAll(std.Node.of(this).path, "/", ".")}--${util.uuidv4()}";

    new simutils.Service(
      "docker",
      ["run", "--name", containerName, "-p", "8000", "amazon/dynamodb-local"],
      onData: inflight (data) => {
        if data.contains("Initializing DynamoDB Local with the following configuration") {
          // state.set("ready", true);
          state.set("url", this.findContainerURL(containerName, 8000));
        }
      }
    );

    new cloud.Service(inflight () => {
      // util.waitUntil(() => {
      //   return state.tryGet("ready")?.tryAsBool() ?? false;
      // });
      util.waitUntil(() => {
        return state.tryGet("url")?;
      });

      log(state.get("url").asStr());

      // util.sleep(1s);

      // Table.createTable({ port: port.port, tableName: "test" });
    }) as "wait until ready";
  }

  extern "./util.js" static replaceAll(value: str, regex: str, replace: str): str;

  extern "./main.mjs" static inflight createTable(props: Json): void;

  // inflight new() {

  // }

  extern "./main.mjs" static inflight execFile(command: str, args: Array<str>, cwd: str?): str;

  inflight findHostPort(containerName: str, port: num): str {
    let inspectResult = Json.parse(Table.execFile("docker", ["inspect", containerName]));
    if let port = inspectResult.tryGetAt(0)?.tryGet("NetworkSettings")?.tryGet("Ports")?.tryGet("${port}/tcp")?.tryGetAt(0)?.tryGet("HostPort") {
      return port.asStr();
    } else {
      throw "Unable to find port [${port}] for container [${containerName}]";
    }
  }

  inflight findContainerURL(containerName: str, port: num): str {
    let hostPort = this.findHostPort(containerName, port);
    return "http://localhost:${hostPort}";
  }
}

let table = new Table();
new cloud.Service(inflight () => {
  log("tableURL = ${table.url}");
});
