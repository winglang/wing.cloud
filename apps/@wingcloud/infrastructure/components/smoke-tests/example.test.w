bring cloud;
bring util;
bring http;
bring "../parameter/parameter.w" as parameter;
bring "./smoke-tests.w" as smokeTests;

let api = new cloud.Api();

api.get("/health", inflight (req) => {
  return {
    status: 200,
    body: "OK",
  };
});

let apiUrlParam = new parameter.Parameter(
  name: "api-url",
  value: api.url,
);

new smokeTests.SmokeTests(
  baseUrl: apiUrlParam,
  path: "/health",
);