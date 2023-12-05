bring cloud;
bring ex;

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

bucket.onCreate(inflight () => {
  log("hello world");
  bucket.put("/hello/world", "hello world");
});

test "hello world" {
  assert(!bucket.exists("/hello/world"));
}

test "hello world - take two" {
  assert(!bucket.exists("/hello/world"));
}