bring websockets;
bring dynamodb;
bring "./jwt.w" as JWT;

struct SendMessageOptions {
  subscriptionId: str;
  userId: str;
  message: str;
}

struct SaveConnectionOpts {
  subscriptionId: str;
  connectionId: str;
  userId: str;
}

struct UserItem {
  connectionIds: Set<str>;
}

struct ConnectionItem {
  userId: str;
  subscriptionId: str;
}

struct WsInputMessage {
  type: str;
  subscriptionId: str;
  payload: str;
}

pub struct AuthenticatedWebSocketServerProps {
  secret: str;
}

pub class AuthenticatedWebsocketServer {
  pub ws: websockets.WebSocket;
  table: dynamodb.Table;
  pub url: str;

  new(props: AuthenticatedWebSocketServerProps) {
    this.table = new dynamodb.Table(
      name: "ws_table",
      attributes: [
        {
          name: "pk",
          type: "S",
        },
        {
          name: "sk",
          type: "S",
        },
      ],
      hashKey: "pk",
      rangeKey: "sk",
    );

    this.ws = new websockets.WebSocket(name: "WingCloudWebsocket") as "wingcloud-websocket";
    this.url = this.ws.url;

    let deleteConnection = inflight(id: str): void => {
      let item = this.table.delete(
        Key: {
          pk: "WS_CONNECTION#{id}",
          sk: "#",
        },
        ReturnValues: "ALL_OLD",
      );
      if let connection = ConnectionItem.tryFromJson(item.Attributes) {
        let userItem = this.table.get(
          Key: {
            pk: "USER#{connection.userId}",
            sk: "SUBSCRIPTION#{connection.subscriptionId}",
          },
          ProjectionExpression: "connectionIds",
        );
        if let userData = UserItem.tryFromJson(userItem.Item) {
          let index = userData.connectionIds.toArray().indexOf(id);
          if index != -1 {
            this.table.transactWrite(
              TransactItems: [{
                Update: {
                  Key: {
                      pk: "USER#{connection.userId}",
                      sk: "SUBSCRIPTION#{connection.subscriptionId}",
                  },
                  UpdateExpression: "REMOVE connectionIds[{index}]",
                }
              }]
            );
          }
        }
      }
    };

    let saveConnection = inflight (opts: SaveConnectionOpts): void => {
      this.table.transactWrite(
        TransactItems: [{
          Update: {
            Key: {
                pk: "USER#{opts.userId}",
                sk: "SUBSCRIPTION#{opts.subscriptionId}",
            },
            UpdateExpression: "SET connectionIds = list_append(if_not_exists(connectionIds, :empty_list), :connectionId)",
            ExpressionAttributeValues: {
                ":connectionId": [opts.connectionId],
                ":empty_list": []
            },
          }
        }]
      );

      this.table.put(
        Item: {
          pk: "WS_CONNECTION#{opts.connectionId}",
          sk: "#",
          subscriptionId: opts.subscriptionId,
          userId: "{opts.userId}",
        },
        ConditionExpression: "attribute_not_exists(pk)",
      );
    };

    this.ws.onMessage(inflight(id: str, message: str): void => {
      let data = WsInputMessage.fromJson(Json.parse(message));
      if data.type == "authorize" && data.payload != "" {
        let jwt = JWT.JWT.verify(
          jwt: data.payload,
          secret: props.secret
        );
        saveConnection(
          subscriptionId: data.subscriptionId,
          connectionId: id,
          userId: jwt.userId
        );
        try {
          this.ws.sendMessage(id, "authorized");
        } catch error {
          log("Failed to send message to connection: {id}: {error}");
        }
      }
    });

    this.ws.onDisconnect(inflight(id: str): void => {
      deleteConnection(id);
    });
  }

  pub inflight sendMessage(opts: SendMessageOptions): void {
    let result = this.table.get(
      Key: {
        pk: "USER#{opts.userId}",
        sk: "SUBSCRIPTION#{opts.subscriptionId}"
      },
      ProjectionExpression: "connectionIds",
    );

    if let item = result.Item {
      let connectionIds = UserItem.fromJson(item).connectionIds;
      for connectionId in connectionIds {
        try {
          this.ws.sendMessage(connectionId, opts.message);
        } catch error {
          log("Failed to send message to connection: {connectionId}: {error}");
        }
      }
    }
  }
}
