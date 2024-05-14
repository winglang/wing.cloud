bring cloud;
bring dynamodb;

let bucket = new cloud.Bucket();
let table = new dynamodb.Table(
      name: "my-table",
      attributes: [
        {
          name: "pk",
          type: "S",
        },
        {
          name: "sk",
          type: "S",
        },
      ],
      hashKey: "pk",
      rangeKey: "sk",
    );

bucket.onCreate(inflight () => {
  log("hello world");
});

test "hello world" {
  assert(!bucket.exists("/hello/world"));
}

test "hello world - take two" {
  assert(!bucket.exists("/hello/world"));
}
