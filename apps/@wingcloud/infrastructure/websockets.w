bring websockets;
bring ex;

struct WebsocketSendOpts {
  key: str;
  body: str;
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
      this.table.updateItem({
        key: {
            pk: "WEBSOCKETS#{this.getUserId()}",
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
      let result = this.table.getItem({
        key: {
            pk: "WEBSOCKETS#{this.getUserId()}",
            sk: "#"
        },
        projectionExpression: "connectionIds",
      });

      if let connections = result.item?.tryGet("connectionIds")?.tryAsStr() {
        let connectionIds = connections.split(",").copyMut();
        let index = connectionIds.indexOf(id);
        if (index > -1) {
          connectionIds.popAt(index);
          this.table.updateItem({
            key: {
                pk: "WEBSOCKETS#{this.getUserId()}",
                sk: "#"
            },
            updateExpression: "SET connectionIds = :newList",
            expressionAttributeValues: {
              ":newList": connectionIds.join(",")
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
    let result = this.table.getItem(
      key: {
        pk: "WEBSOCKETS#{this.getUserId()}",
        sk: "#"
      },
      projectionExpression: "connectionIds",
    );

    let connections = result.item?.tryGet("connectionIds")?.tryAsStr() ?? "";
    for connectionId in connections.split(",") {
      this.ws.sendMessage(connectionId, opts.body);
    }
  }

  inflight getUserId(): str {
    let userId = "polamoros";

    return userId;
  }
}
