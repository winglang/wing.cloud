bring cloud;

let api = new cloud.Api();

api.get("/", inflight (req) => {
  return {
    status: 200,
    body: "OK"
  };
});
