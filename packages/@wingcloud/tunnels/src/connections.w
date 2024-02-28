bring ex;

pub struct Connection {
  connectionId: str;
  subdomain: str;
}

pub interface IConnections {
  inflight addConnection(connectionId: str): void;
  inflight updateConnectionWithSubdomain(conn: Connection): void;
  inflight removeConnection(connectionId: str): void;
  inflight findConnectionBySubdomain(subdomain: str): Connection?;
  inflight addResponseForRequest(requestId: str, req: Json): void;
  inflight findResponseForRequest(requestId: str): Json?;
  inflight removeResponseForRequest(requestId: str): void;
}

pub class Connections impl IConnections {
  connections: ex.DynamodbTable;
  requests: ex.Redis;
  new() {
    this.connections = new ex.DynamodbTable(name: "key", hashKey: "key", attributeDefinitions: { key: "S" });
    this.requests = new ex.Redis();
  }

  pub inflight addConnection(connectionId: str) {
    this.connections.putItem(item: {
      key: "connectionId#{connectionId}",
    });
  }

  pub inflight updateConnectionWithSubdomain(conn: Connection) {
    this.connections.transactWriteItems(
      transactItems: [
        {
          update: {
            key: {
              key: "connectionId#{conn.connectionId}",
            },
            updateExpression: "set subdomain = :subdomain",
            expressionAttributeValues: { ":subdomain": conn.subdomain }
          },
        },
        {
          put: {
            item: {
              key: "subdomain#{conn.subdomain}",
              connectionId: conn.connectionId
            }
          },
        }
      ]
    );
  }

  pub inflight removeConnection(connectionId: str) {
    let item = this.connections.getItem(key: {
      key: "connectionId#{connectionId}",
    });

    if let item = item.item {
      let subdomain = item.get("subdomain").asStr();
      this.connections.transactWriteItems(
        transactItems: [
          {
            delete: {
              key: {
                key: "connectionId#{connectionId}",
              }
            },
          },
          {
            delete: {
              key: {
                key: "subdomain#{subdomain}",
              }
            },
          },
        ]
      );
    }
  }

  pub inflight findConnectionBySubdomain(subdomain: str): Connection? {
    let item = this.connections.getItem(key: {
      key: "subdomain#{subdomain}",
    });

    if let item = item.item {
      return Connection{
        connectionId: item.get("connectionId").asStr(),
        subdomain: subdomain
      };
    } else {
      return nil;
    }
  }

  pub inflight addResponseForRequest(requestId: str, req: Json) {
    this.requests.set(requestId, Json.stringify(req));
  }

  pub inflight findResponseForRequest(requestId: str): Json? {
    let req = this.requests.get(requestId);
    if req == nil {
      return nil;
    } else {
      return Json.parse(req ?? "");
    }
  }

  pub inflight removeResponseForRequest(requestId: str) {
    this.requests.del(requestId);
  }
}
