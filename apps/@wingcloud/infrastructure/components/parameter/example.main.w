bring cloud;
bring expect;
bring "./parameter.w" as p;

let param = new p.Parameter(
  name: "foo",
  value: "bar"
);

let fn = new cloud.Function(inflight (event: str) => {
  let value = param.get();
  log("value: " + value);
});

test "config" {
  expect.equal(param.get(), "bar");
}
