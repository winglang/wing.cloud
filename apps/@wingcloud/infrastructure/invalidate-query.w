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
    let SUBSCRIPTION_ID = "invalidateQuery";

    for query in options.queries ?? ["*"] {
      this.ws.sendMessage(
        subscriptionId: SUBSCRIPTION_ID,
        userId: options.userId,
        message: Json.stringify({
          type: SUBSCRIPTION_ID,
          query: query,
          payload: options.payload,
        })
      );
    }
  }
}
