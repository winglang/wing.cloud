bring cloud;

let api = new cloud.Api();
let url = api.url;

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
