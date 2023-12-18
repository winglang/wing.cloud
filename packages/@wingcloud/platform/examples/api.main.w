bring cloud;
bring ex;
bring http;
bring expect;

let bucket = new cloud.Bucket();
let table = new ex.DynamodbTable({
  name: "my-table",
  attributeDefinitions: {
    "pk": "S",
    "sk": "S",
  },
  hashKey: "pk",
  rangeKey: "sk",
});

bucket.onCreate(inflight (event) => {
  log("hello form bucket handler {event}");

  table.putItem({
    item: {
      "pk": "key1",
      "sk": "value1",
      "k3": "other-value1"
    }
  });
});

let api = new cloud.Api();

api.get("/hello", inflight (request) => {
  log("hello from api handler");

  bucket.putJson("/hello/world", {
    "hello": "world",
  });

  return {
    status: 200,
    body: "hello world",
  };
});

test "hello world" {
  let response = http.get("{api.url}/hello");
  log("response: {response}");
  expect.equal(200, response.status);
}
