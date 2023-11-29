bring cloud;
bring util;
bring sim;
bring "./node_modules/@wingcloud/simutils/index.w" as simutils;

interface DynamodbClient {}

class DynamodbHost {
  pub endpoint: str;

  new() {
    let state = new sim.State();
    this.endpoint = state.token("endpoint");

    let containerName = "wingcloud-dynamodb-{util.uuidv4()}";

    let port = new simutils.Port();

    new simutils.Service(
      "docker",
      ["run", "--rm", "--name", containerName, "-p", "{port.port}:8000", "amazon/dynamodb-local"],
      onData: inflight (data) => {
        log("[docker] {data}");
        if data.contains("Initializing DynamoDB Local with the following configuration") {
          state.set("endpoint", "http://0.0.0.0:{port.port}");
          log("[docker] endpoint = http://0.0.0.0:{port.port}");
        }
      }
    );

    // The host will be ready when the endpoint is set.
    new cloud.Service(inflight () => {
      util.waitUntil(() => {
        return state.tryGet("endpoint")?;
      });
    });
  }

  pub static of(scope: std.IResource): DynamodbHost {
    let uid = "DynamodbHost-7JOQ92VWh6OavMXYpWx9O";
    let root = std.Node.of(scope).root;
    let rootNode = std.Node.of(root);
    return unsafeCast(rootNode.tryFindChild(uid)) ?? new DynamodbHost() as uid in root;
  }
}

class Table {
  dynamodbHost: DynamodbHost;

  pub tableName: str;

  new() {
    this.dynamodbHost = DynamodbHost.of(this);

    // this.node.addDependency(this.dynamodbHost);
    // this.dynamodbHost.node.addDependency(this);

    // this.tableName = Table.replaceAll(this.node.path, "/", "-");
    let tableName = Table.replaceAll(this.node.path, "/", "-");

    let state = new sim.State();
    this.tableName = state.token("tableName");

    // Not sure if this is needed.
    new cloud.Service(inflight () => {
      log(this.dynamodbHost.endpoint);
      // let tableName = "aha";
      // let tableName = this.tableName;
      util.waitUntil(() => {
        log("creating table");
        try {
          let client = Table.createClient({
            endpoint: this.dynamodbHost.endpoint,
          });
          Table.createTable(client, { tableName: tableName });
          state.set("tableName", tableName);
          log("table created");
          return true;
        } catch error {
          log(error);
          log("Waiting for DynamoDB Host to be ready...");
          return false;
        }
      });
    });
    // new cloud.Service(inflight () => {
    //   Table.createTable(this.client, { tableName: this.tableName });
    // });
  }

  // pub onLift(host: std.IInflightHost, ops: Array<str>) {
  //   log("[{this.node.path}] onLift: {std.Node.of(host).path} [{unsafeCast(ops)}]");
  // }

  extern "./util.js" static replaceAll(value: str, regex: str, replace: str): str;

  extern "./main.mjs" static inflight createClient(props: Json): DynamodbClient;
  extern "./main.mjs" static inflight createTable(client: DynamodbClient, props: Json): void;
  extern "./main.mjs" static inflight testClient(client: DynamodbClient, props: Json): Json;
  extern "./main.mjs" static inflight processRecordsAsync(props: Json): void;

  inflight client: DynamodbClient;
  inflight new() {
    log("inflight new()");
    this.client = Table.createClient({
      endpoint: this.dynamodbHost.endpoint,
    });
  }

  pub inflight testClient2() {
    log(unsafeCast(Table.testClient(this.client, { tableName: this.tableName })));
  }

  pub inflight processRecords() {
    Table.processRecordsAsync({ endpoint: this.dynamodbHost.endpoint, tableName: this.tableName });
  }
}

let table = new Table();
new cloud.Service(inflight () => {
  log("consuming table");
  log("table name = {table.tableName}");
  table.processRecords();
  log("ok");
}) as "Record Processor";

new cloud.Function(inflight () => {
  table.testClient2();
});
