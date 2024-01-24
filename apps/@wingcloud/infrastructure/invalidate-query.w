bring "./websockets.w" as websockets;

pub struct InvalidateQueryProps {
  ws: websockets.WebSocket;
}

struct InvalidateOpts {
  userId: str;
  key: str;
  query: str?;
  payload: str?;
}

pub class InvalidateQuery {
  pub ws: websockets.WebSocket;

  new(props: InvalidateQueryProps) {
    this.ws = props.ws;
  }

  pub inflight invalidate(options: InvalidateOpts) {
    let var queries = MutArray<str>[];
    if let query = options.query  {
      queries.push(query);
    }

    // Invalidation logic for special keys
    if options.key == "environment.report" {
      queries.push("app.listEnvironments");
    }

    for query in queries {
      this.ws.sendMessage(
        subscriptionId: "app.invalidateQuery",
        userId: options.userId,
        key: options.key,
        query: query,
        payload: options.payload,
      );
    }
  }
}
