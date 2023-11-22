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

    let port = new simutils.Port();
    // new cloud.Service(inflight () => {
    //   state.set("endpoint", "http://0.0.0.0:${port.port}");
    // });

    let containerName = "wingcloud-dynamodb-${util.uuidv4()}";

    new simutils.Service(
      "docker",
      ["run", "--name", containerName, "-p", "${port.port}:8000", "amazon/dynamodb-local"],
      onData: inflight (data) => {
        if data.contains("Initializing DynamoDB Local with the following configuration") {
          state.set("endpoint", "http://0.0.0.0:${port.port}");
          // state.set("ready", true);
        }
      }
    );

    new cloud.Service(inflight () => {
      util.waitUntil(() => {
        return state.tryGet("endpoint")?;
      });
    });
  }
}

class Table {
  dynamodbHost: DynamodbHost;

  tableName: str;

  new(dynamodbHost: DynamodbHost) {
    this.dynamodbHost = dynamodbHost;

    this.tableName = Table.replaceAll(this.node.path, "/", "-");

    new cloud.Service(inflight () => {
      Table.createTable(this.client, { tableName: this.tableName });
    });
  }

  extern "./util.js" static replaceAll(value: str, regex: str, replace: str): str;

  extern "./main.mjs" static inflight createClient(props: Json): DynamodbClient;
  extern "./main.mjs" static inflight createTable(client: DynamodbClient, props: Json): void;
  extern "./main.mjs" static inflight testClient(client: DynamodbClient, props: Json): Json;
  extern "./main.mjs" static inflight processRecords(props: Json): void;

  inflight client: DynamodbClient;
  inflight new() {
    this.client = Table.createClient({
      endpoint: this.dynamodbHost.endpoint,
    });
  }

  pub inflight testClient2() {
    log(unsafeCast(Table.testClient(this.client, { tableName: this.tableName })));
  }

  pub inflight processRecords2() {
    Table.processRecords({ endpoint: this.dynamodbHost.endpoint, tableName: this.tableName });
  }
}

let dynamodbHost = new DynamodbHost();
let table = new Table(dynamodbHost);
new cloud.Service(inflight () => {
  table.processRecords2();
});


// let table2 = new Table(dynamodbHost) as "t2";
// new cloud.Service(inflight () => {
//   table2.testClient2();
// }) as "s2";

new cloud.Function(inflight () => {
  table.testClient2();
});
