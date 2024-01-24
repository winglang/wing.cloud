bring websockets;
bring ex;
bring "./jwt.w" as JWT;

struct WebsocketSendOpts {
  userId: str;
  key: str;
  query: str?;
  payload: Json?;
}

struct WebsocketMessage {
  key: str;
  query: str?;
  payload: Json?;
}

struct UserItem {
  connectionIds: Set<str>;
}

struct ConnectionItem {
  userId: str;
}

struct WsInputMessage {
  type: str;
  payload: str;
}

pub struct WebSocketProps {
  secret: str;
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
      let connection = this.table.deleteItem(
        key: {
          pk: "WS_CONNECTION#{id}",
          sk: "#",
        },
        returnValues: "ALL_OLD",
      );
      if let user = ConnectionItem.tryFromJson(connection.attributes) {
        let userItem = this.table.getItem(
          key: {
            pk: "WS_USER#{user.userId}",
            sk: "#",
          },
          projectionExpression: "connectionIds",
        );
        if let userData = UserItem.tryFromJson(userItem.item) {
          let connectionIds = userData.connectionIds.copyMut();
          connectionIds.delete(id);
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
      }
    };

    this.ws.onMessage(inflight(id: str, message: str): void => {
      let data = WsInputMessage.fromJson(Json.parse(message));
      if data.type == "authorize" && data.payload != "" {
        let jwt = JWT.JWT.verify(
          jwt: data.payload,
          secret: props.secret
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

  pub inflight sendMessage(opts: WebsocketSendOpts): void {
    let result = this.table.getItem(
      key: {
        pk: "WS_USER#{opts.userId}",
        sk: "#"
      },
      projectionExpression: "connectionIds",
    );

    let message = WebsocketMessage.fromJson({
      key: opts.key,
      query: opts.query,
      payload: opts.payload,
    });

    if let item = result.item {
      let connectionIds = UserItem.fromJson(item).connectionIds;
      for connectionId in connectionIds {
        this.ws.sendMessage(connectionId, Json.stringify(message));
      }
    }
  }
}
