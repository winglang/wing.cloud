bring cloud;

let api = new cloud.Api();
let url = api.url;
let counter = new cloud.Counter();

api.get("/", inflight (req) => {
  return {
    status: 200,
    body: "OK"
  };
});

api.get("/url", inflight (req) => {
  return {
    status: 200,
    body: url
  };
});

api.get("/inc", inflight (req) => {
  counter.inc();
  return {
    status: 200,
    body: "{counter.peek()}"
  };
});
