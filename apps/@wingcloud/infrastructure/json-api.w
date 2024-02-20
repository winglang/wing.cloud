bring cloud;

struct JsonApiProps {
  api: cloud.Api;
}

struct JsonApiResponse {
  status: num?;
  headers: Map<str>?;
  body: Json?;
}

struct HttpErrorResponse {
  code: num;
  message: str;
}

interface Middleware {
  inflight handle(request: cloud.ApiRequest, next: inflight (cloud.ApiRequest): JsonApiResponse): JsonApiResponse;
}

pub class JsonApi {
  api: cloud.Api;
  pub url: str;
  var handlerCount: num;
  var middlewares: MutArray<Middleware>;

  new(props: JsonApiProps) {
    this.api = props.api;
    this.url = this.api.url;
    this.handlerCount = 0;
    this.middlewares = MutArray<Middleware>[];
  }

  wrapHandler(
    handler: inflight (cloud.ApiRequest): JsonApiResponse,
    middlewares: Array<Middleware>,
  ): inflight (cloud.ApiRequest): cloud.ApiResponse {
    class MyHandler {
      inflight applyMiddlewares(request: cloud.ApiRequest, index: num?): JsonApiResponse {
        if let middleware = middlewares.tryAt(index ?? 0) {
          let next = (request: cloud.ApiRequest): JsonApiResponse => {
            let newIndex = (index ?? 0) + 1;
            if newIndex < middlewares.length {
              return this.applyMiddlewares(request, newIndex);
            }
            return handler(request);
          };
          return middleware.handle(request, next);
        }
        return handler(request);
      }

      inflight handle(request: cloud.ApiRequest): cloud.ApiResponse {
        try {
          let response = this.applyMiddlewares(request);

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
          if let httpError = HttpErrorResponse.tryFromJson(Json.tryParse(error)) {
            return {
              status: httpError.code,
              headers: {
                "content-type": "application/json",
              },
              body: Json.stringify({
                error: httpError.message,
              }),
            };
          }

          log("Internal server error");
          log(unsafeCast(error));

          return {
            status: 500,
            headers: {
              "content-type": "application/json",
            },
            body: Json.stringify({
              error: "Internal server error",
            }),
          };
        }
      }
    }
    this.handlerCount += 1;
    return new MyHandler() as "Handler{this.handlerCount}";
  }

  pub addMiddleware(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  pub get(path: str, handler: inflight (cloud.ApiRequest): JsonApiResponse) {
    this.api.get(path, this.wrapHandler(handler, this.middlewares.copy()));
  }

  pub post(path: str, handler: inflight (cloud.ApiRequest): JsonApiResponse) {
    this.api.post(path, this.wrapHandler(handler, this.middlewares.copy()));
  }

  pub put(path: str, handler: inflight (cloud.ApiRequest): JsonApiResponse) {
    this.api.put(path, this.wrapHandler(handler, this.middlewares.copy()));
  }
}
