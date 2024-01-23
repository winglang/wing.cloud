bring websockets;
bring ex;
bring "./jwt.w" as JWT;

struct WebsocketSendOpts {
  userId: str;
  payload: Json;
}

struct UserItem {
  connectionIds: Set<str>;
}

struct ConnectionItem {
  userId: str;
}

struct WebsocketMessage {
  type: str;
  payload: str;
}

pub struct WebSocketProps {
  appSecret: str;
}

pub class WebSocket {
  pub ws: websockets.WebSocket;
  table: ex.DynamodbTable;
  pub url: str;

  new(props: WebSocketProps) {
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

    let saveConnection = inflight (id: str, userId: str): void => {
      this.table.updateItem(
        key: {
          pk: "WS_USER#{userId}",
          sk: "#",
        },
        updateExpression: "SET connectionIds = list_append(if_not_exists(connectionIds, :empty_list), :connectionId)",
        expressionAttributeValues: {
            ":connectionId": ["{id}"],
            ":empty_list": []
        },
      );
      this.table.putItem(
        item: {
          pk: "WS_CONNECTION#{id}",
          sk: "#",
          userId: "{userId}",
        },
        conditionExpression: "attribute_not_exists(pk)",
      );
    };

    let deleteConnection = inflight(id: str): void => {
      let connection = this.table.getItem(
        key: {
          pk: "WS_CONNECTION#{id}",
          sk: "#",
        },
        projectionExpression: "userId",
      );
      if let user = ConnectionItem.tryFromJson(connection.item) {
        this.table.deleteItem(
          key: {
            pk: "WS_CONNECTION#{id}",
            sk: "#",
          },
        );

        let userItem = this.table.getItem(
          key: {
            pk: "WS_USER#{user.userId}",
            sk: "#",
          },
          projectionExpression: "connectionIds",
        );
        if let userData = UserItem.tryFromJson(userItem) {
          let connectionIds = userData.connectionIds.copyMut();
          if connectionIds.delete(id) {
            this.table.updateItem({
              key: {
                  pk: "WS_USER#{user.userId}",
                  sk: "#"
              },
              updateExpression: "SET connectionIds = :newList",
              expressionAttributeValues: {
                ":newList": connectionIds.toArray()
              },
            });
          }
        } else {
          log("WS User '{user.userId}' not found");
        }
      } else {
        log("Connection '{id}' not found");
      }
    };

    this.ws.onMessage(inflight(id: str, message: str): void => {
      let data = WebsocketMessage.fromJson(Json.parse(message));
      if data.type == "authorize" && data.payload != "" {
        let jwt = JWT.JWT.verify(
          jwt: data.payload,
          secret: props.appSecret
        );
        saveConnection(id, jwt.userId);
      }
    });

    this.ws.onDisconnect(inflight(id: str): void => {
      deleteConnection(id);
    });

    /* This method is temporarily required only for local execution (target sim) and will be deprecated in the future.
    */
    this.ws.initialize();
  }

  pub inflight send(opts: WebsocketSendOpts) {
    let result = this.table.getItem(
      key: {
        pk: "WS_USER#{opts.userId}",
        sk: "#"
      },
      projectionExpression: "connectionIds",
    );
    if let item = result.item {
      let connectionIds = UserItem.fromJson(item).connectionIds;
      for connectionId in connectionIds {
        this.ws.sendMessage(connectionId, Json.stringify(opts.payload));
      }
    }
  }
}
