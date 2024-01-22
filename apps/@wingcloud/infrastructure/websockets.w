bring websockets;
bring ex;

struct WebsocketSendOpts {
  userId: str;
  payload: Json;
}

struct WebsocketItem {
  connectionIds: Set<str>;
}

pub class WebSocket {
  pub ws: websockets.WebSocket;
  table: ex.DynamodbTable;
  pub url: str;

  new(table: ex.DynamodbTable) {
    this.table = table;
    this.ws = new websockets.WebSocket(name: "WingCloudWebsocket") as "wingcloud-websocket";
    this.url = this.ws.url;

    this.ws.onConnect(inflight(id: str): void => {
      let userId = this.getUserId();
      this.table.updateItem({
        key: {
            pk: "WEBSOCKETS#{userId}",
            sk: "#"
        },
        updateExpression: "SET connectionIds = list_append(if_not_exists(connectionIds, :empty_list), :connectionId)",
        expressionAttributeValues: {
            ":connectionId": ["{id}"],
            ":empty_list": []
        },
      });
    });

    this.ws.onDisconnect(inflight(id: str): void => {
      let userId = this.getUserId();
      let result = this.table.getItem({
        key: {
            pk: "WEBSOCKETS#{userId}",
            sk: "#"
        },
        projectionExpression: "connectionIds",
      });

      if let item = result.item {
        let connections = WebsocketItem.fromJson(item).connectionIds;
        let connectionIds = connections.copyMut();
        if connectionIds.delete(id) {
          this.table.updateItem({
            key: {
                pk: "WEBSOCKETS#{userId}",
                sk: "#"
            },
            updateExpression: "SET connectionIds = :newList",
            expressionAttributeValues: {
              ":newList": connectionIds.toArray()
            },
          });
        }
      }
    });

    /* This method is temporarily required only for local execution (target sim) and will be deprecated in the future.
    */
    this.ws.initialize();
  }

  pub inflight send(opts: WebsocketSendOpts) {
    let userId = this.getUserId(); // opts.userId;
    let result = this.table.getItem(
      key: {
        pk: "WEBSOCKETS#{userId}",
        sk: "#"
      },
      projectionExpression: "connectionIds",
    );
    if let item = result.item {
      let connectionIds = WebsocketItem.fromJson(item).connectionIds;
      for connectionId in connectionIds{
        this.ws.sendMessage(connectionId, Json.stringify(opts));
      }
    }
  }

  inflight getUserId(): str {
    let userId = "polamoros";

    return userId;
  }
}
