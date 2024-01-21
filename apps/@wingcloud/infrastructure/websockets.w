bring websockets;
bring ex;

struct WebsocketSendOpts {
  key: str;
  body: str;
}

pub class WebSocket {
  ws: websockets.WebSocket;
  tb: ex.DynamodbTable;
  pub url: str;

  new() {
    this.ws = new websockets.WebSocket(name: "WingCloudWebsocket") as "wingcloud-websocket";
    this.url = this.ws.url;
    this.tb = new ex.DynamodbTable(
      name: "WebSocketTable",
      hashKey: "connectionId",
      attributeDefinitions: {
        "connectionId": "S",
      },
    ) as "wsTable";

    this.ws.onConnect(inflight(id: str): void => {
      this.tb.putItem({
        item: {
          "connectionId": id
        }
      });
    });

    this.ws.onDisconnect(inflight(id: str): void => {
      this.tb.deleteItem({
        key: {
          "connectionId": id
        }
      });
    });

    this.ws.onMessage(inflight (id: str, body: str): void => {
      let connections = this.tb.scan();
      for item in connections.items {
        this.ws.sendMessage(str.fromJson(item.get("connectionId")), body);
      }
    });

    /* This method is temporarily required only for local execution (target sim) and will be deprecated in the future.
    */
    this.ws.initialize();
  }

  pub inflight send(opts: WebsocketSendOpts) {
      let connections = this.tb.scan();
      for item in connections.items {
        this.ws.sendMessage(str.fromJson(item.get("connectionId")), opts.body);
      }
  }
}
