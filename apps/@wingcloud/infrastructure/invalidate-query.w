bring "./websockets.w" as websockets;

pub struct InvalidateQueryProps {
  ws: websockets.WebSocket;
}

struct InvalidateOpts {
  userId: str;
  queries: Array<str>?;
  payload: str?;
}

pub class InvalidateQuery {
  pub ws: websockets.WebSocket;

  new(props: InvalidateQueryProps) {
    this.ws = props.ws;
  }

  pub inflight invalidate(options: InvalidateOpts) {
    for query in options.queries ?? ["*"] {
      this.ws.sendMessage(
        subscriptionId: "app.invalidateQuery",
        userId: options.userId,
        query: query,
        payload: options.payload,
      );
    }
  }
}
