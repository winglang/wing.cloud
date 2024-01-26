bring "./authenticated-websocket-server.w" as wsServer;

pub struct InvalidateQueryProps {
  subscriptionId: str;
  ws: wsServer.AuthenticatedWebsocketServer;
}

struct InvalidateOpts {
  userId: str;
  queries: Array<str>?;
  payload: str?;
}

pub class InvalidateQuery {
  pub ws: wsServer.AuthenticatedWebsocketServer;
  subscriptionId: str;

  new(props: InvalidateQueryProps) {
    this.ws = props.ws;
    this.subscriptionId = props.subscriptionId;
  }

  pub inflight invalidate(options: InvalidateOpts) {
    for query in options.queries ?? ["*"] {
      this.ws.sendMessage(
        subscriptionId: this.subscriptionId,
        userId: options.userId,
        message: Json.stringify({
          type: this.subscriptionId,
          query: query,
          payload: options.payload,
        })
      );
    }
  }
}
