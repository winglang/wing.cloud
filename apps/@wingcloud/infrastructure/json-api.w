bring cloud;

struct JsonApiProps {
  api: cloud.Api;
}

struct JsonApiResponse {
  status: num?;
  headers: Map<str>?;
  body: Json?;
}

pub class JsonApi {
  api: cloud.Api;
  pub url: str;

  new(props: JsonApiProps) {
    this.api = props.api;
    this.url = this.api.url;
  }

  wrapHandler(handler: inflight (cloud.ApiRequest): JsonApiResponse): inflight (cloud.ApiRequest): cloud.ApiResponse {
    class MyHandler {
      inflight handle(request: cloud.ApiRequest): cloud.ApiResponse {
        try {
          let response = handler(request);

          let headers = response.headers?.copyMut();
          headers?.set("content-type", "application/json");

          let var bodyStr = "";
          if let body = response.body {
            bodyStr = Json.stringify(body);
          }

          return {
            status: response.status ?? 200,
            headers: headers?.copy(),
            body: bodyStr,
          };
        } catch error {
          // TODO: This is a hack to get around the fact that errors are just strings
          if error == "Bad credentials" {
            return {
              status: 401,
              headers: {
                "content-type": "application/json",
              },
              body: Json.stringify({
                error: error,
              }),
            };
          }

          return {
            status: 500,
            headers: {
              "content-type": "application/json",
            },
            body: Json.stringify({
              error: error,
            }),
          };
        }
      }
    }
    return new MyHandler() as "Handler";
  }

  pub get(path: str, handler: inflight (cloud.ApiRequest): JsonApiResponse) {
    this.api.get(path, this.wrapHandler(handler));
  }

  pub post(path: str, handler: inflight (cloud.ApiRequest): JsonApiResponse) {
    this.api.post(path, this.wrapHandler(handler));
  }

  pub put(path: str, handler: inflight (cloud.ApiRequest): JsonApiResponse) {
    this.api.put(path, this.wrapHandler(handler));
  }
}
