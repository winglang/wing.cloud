bring websockets;
bring ex;
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
  table: ex.DynamodbTable;
  pub url: str;

  new(props: AuthenticatedWebSocketServerProps) {
    this.table = new ex.DynamodbTable(
      name: "ws_table",
      attributeDefinitions: {
        "pk": "S",
        "sk": "S",
      },
      hashKey: "pk",
      rangeKey: "sk",
    );

    this.ws = new websockets.WebSocket(name: "WingCloudWebsocket") as "wingcloud-websocket";
    this.url = this.ws.url;

    let deleteConnection = inflight(id: str): void => {
      let item = this.table.deleteItem(
        key: {
          pk: "WS_CONNECTION#{id}",
          sk: "#",
        },
        returnValues: "ALL_OLD",
      );
      if let connection = ConnectionItem.tryFromJson(item.attributes) {
        let userItem = this.table.getItem(
          key: {
            pk: "USER#{connection.userId}",
            sk: "SUBSCRIPTION#{connection.subscriptionId}",
          },
          projectionExpression: "connectionIds",
        );
        if let userData = UserItem.tryFromJson(userItem.item) {
          let index = userData.connectionIds.toArray().indexOf(id);
          if index != -1 {
            this.table.updateItem({
              key: {
                  pk: "USER#{connection.userId}",
                  sk: "SUBSCRIPTION#{connection.subscriptionId}",
              },
              updateExpression: "REMOVE connectionIds[{index}]",
            });
          }
        }
      }
    };

    let saveConnection = inflight (opts: SaveConnectionOpts): void => {
      this.table.updateItem(
        key: {
          pk: "USER#{opts.userId}",
          sk: "SUBSCRIPTION#{opts.subscriptionId}",
        },
        updateExpression: "SET connectionIds = list_append(if_not_exists(connectionIds, :empty_list), :connectionId)",
        expressionAttributeValues: {
            ":connectionId": [opts.connectionId],
            ":empty_list": []
        },
      );

      this.table.putItem(
        item: {
          pk: "WS_CONNECTION#{opts.connectionId}",
          sk: "#",
          subscriptionId: opts.subscriptionId,
          userId: "{opts.userId}",
        },
        conditionExpression: "attribute_not_exists(pk)",
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
        this.ws.sendMessage(id, "authorized");
      }
    });

    this.ws.onDisconnect(inflight(id: str): void => {
      deleteConnection(id);
    });

    /* This method is temporarily required only for local execution (target sim) and will be deprecated in the future.
    */
    this.ws.initialize();
  }

  pub inflight sendMessage(opts: SendMessageOptions): void {
    let result = this.table.getItem(
      key: {
        pk: "USER#{opts.userId}",
        sk: "SUBSCRIPTION#{opts.subscriptionId}"
      },
      projectionExpression: "connectionIds",
    );

    if let item = result.item {
      let connectionIds = UserItem.fromJson(item).connectionIds;
      for connectionId in connectionIds {
        this.ws.sendMessage(connectionId, opts.message);
      }
    }
  }
}
