bring ex;

pub struct Connection {
  connectionId: str;
  subdomain: str;
}

pub interface IConnections {
  inflight addConnectionWithSubdomain(conn: Connection): void;
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
    this.connections = new ex.DynamodbTable(name: "connections", hashKey: "pk", attributeDefinitions: { pk: "S" }) as "connections";
    this.requests = new ex.Redis();
  }

  pub inflight addConnectionWithSubdomain(conn: Connection) {
    this.connections.transactWriteItems(
      transactItems: [
        {
          put: {
            item: {
              pk: "connectionId#{conn.connectionId}",
              subdomain: conn.subdomain
            },
            conditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          put: {
            item: {
              pk: "subdomain#{conn.subdomain}",
              connectionId: conn.connectionId
            },
            conditionExpression: "attribute_not_exists(pk)"
          },
        }
      ]
    );
  }

  pub inflight removeConnection(connectionId: str) {
    let item = this.connections.getItem(key: {
      pk: "connectionId#{connectionId}",
    });

    if let item = item.item {
      let subdomain = item.get("subdomain").asStr();
      this.connections.transactWriteItems(
        transactItems: [
          {
            delete: {
              key: {
                pk: "connectionId#{connectionId}",
              }
            },
          },
          {
            delete: {
              key: {
                pk: "subdomain#{subdomain}",
              }
            },
          },
        ]
      );
    }
  }

  pub inflight findConnectionBySubdomain(subdomain: str): Connection? {
    let item = this.connections.getItem(key: {
      pk: "subdomain#{subdomain}",
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
