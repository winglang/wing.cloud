bring cloud;
bring util;
bring sim;
bring "./node_modules/@wingcloud/simutils/index.w" as simutils;

interface DynamodbClient {}

class Table {
  pub endpoint: str;

  new() {
    let state = new sim.State();
    this.endpoint = state.token("endpoint");

    let port = new simutils.Port();
    new cloud.Service(inflight () => {
      state.set("endpoint", "http://0.0.0.0:${port.port}");
    });

    let containerName = "wingcloud--${Table.replaceAll(std.Node.of(this).path, "/", ".")}--${util.uuidv4()}";

    new simutils.Service(
      "docker",
      ["run", "--name", containerName, "-p", "${port.port}:8000", "amazon/dynamodb-local"],
      onData: inflight (data) => {
        if data.contains("Initializing DynamoDB Local with the following configuration") {
          state.set("ready", true);
          // state.set("url", this.findContainerURL(containerName, 8000));
        }
      }
    );

    new cloud.Service(inflight () => {
      // util.waitUntil(() => {
      //   return state.tryGet("ready")?.tryAsBool() ?? false;
      // });
      // util.waitUntil(() => {
      //   return state.tryGet("url")?;
      // });

      util.waitUntil(() => {
        try {
          Table.createTable(this.client, { endpoint: this.endpoint, tableName: "test" });
          return true;
        } catch {
          return false;
        }
      });

    }) as "wait until ready";
  }

  extern "./util.js" static replaceAll(value: str, regex: str, replace: str): str;

  extern "./main.mjs" static inflight createClient(props: Json): DynamodbClient;
  extern "./main.mjs" static inflight createTable(client: DynamodbClient, props: Json): void;
  extern "./main.mjs" static inflight testClient(client: DynamodbClient, props: Json): Json;

  inflight client: DynamodbClient;
  inflight new() {
    this.client = Table.createClient({ endpoint: this.endpoint });
  }

  pub inflight testClient2() {
    log(unsafeCast(Table.testClient(this.client, { tableName: "test" })));
  }
}

let table = new Table();
new cloud.Service(inflight () => {
  log("tableURL = ${table.endpoint}");
  table.testClient2();
});
