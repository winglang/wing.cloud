bring dynamodb;
bring ex;

pub struct Connection {
  connectionId: str;
  subdomain: str;
}

/**
  * IConnections is an interface for managing websocket connections and websocket requests/responses.
*/
pub interface IConnections {
  /**
    * addConnection connects a websocket connction id with a subdomain.
  */
  inflight addConnection(conn: Connection): void;
  /**
    * removeConnection removes the given websocket connction id.
  */
  inflight removeConnection(connectionId: str): void;
  /**
    * findConnectionBySubdomain finds a websocket connection from given connction id.
  */
  inflight findConnectionBySubdomain(subdomain: str): Connection?;
  /**
    * addResponseForRequest add a websocket response for the given request id.
  */
  inflight addResponseForRequest(requestId: str, req: Json): void;
  /**
    * findResponseForRequest gets a websocket response for the given request id.
  */
  inflight findResponseForRequest(requestId: str): Json?;
  /**
    * removeResponseForRequest removes a request id and its websocket response.
  */
  inflight removeResponseForRequest(requestId: str): void;
}

/**
  * Connections implements the IConnections interface for managing websocket connections
  * by using DynamoDB to manage websocket connections and Redis for handling websocket requests/responses.
*/
pub class Connections impl IConnections {
  connections: dynamodb.Table;
  requests: ex.Redis;
  new() {
    this.connections = new dynamodb.Table(
      name: "connections",
      hashKey: "pk",
      attributes: [
        {
          name: "pk",
          type: "S",
        }
      ]
    ) as "connections";
    this.requests = new ex.Redis();
  }

  pub inflight addConnection(conn: Connection) {
    this.connections.transactWrite(
      TransactItems: [
        {
          Put: {
            Item: {
              pk: "connectionId#{conn.connectionId}",
              subdomain: conn.subdomain
            },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          Put: {
            Item: {
              pk: "subdomain#{conn.subdomain}",
              connectionId: conn.connectionId
            },
            ConditionExpression: "attribute_not_exists(pk)"
          },
        }
      ]
    );
  }

  pub inflight removeConnection(connectionId: str) {
    let item = this.connections.get(Key: {
      pk: "connectionId#{connectionId}",
    });

    if let item = item.Item {
      let subdomain = item.get("subdomain").asStr();
      this.connections.transactWrite(
        TransactItems: [
          {
            Delete: {
              Key: {
                pk: "connectionId#{connectionId}",
              }
            },
          },
          {
            Delete: {
              Key: {
                pk: "subdomain#{subdomain}",
              }
            },
          },
        ]
      );
    }
  }

  pub inflight findConnectionBySubdomain(subdomain: str): Connection? {
    let item = this.connections.get(Key: {
      pk: "subdomain#{subdomain}",
    });

    if let item = item.Item {
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
    if let req = this.requests.get(requestId) {
      return Json.parse(req);
    } else {
      return nil;
    }
  }

  pub inflight removeResponseForRequest(requestId: str) {
    this.requests.del(requestId);
  }
}
