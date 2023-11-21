bring cloud;

let bucket = new cloud.Bucket();

test "hello world" {
  assert(!bucket.exists("/hello/world"));
}