bring cloud;
bring expect;
bring "./config.w" as c;

let config = new c.Config(
    name: "foo",
    value: "bar"
);

let fn = new cloud.Function(inflight (event: str) => {
    let value = config.get();
    log("value: " + value);
});

test "config" {
    expect.equal(config.get(), "bar");
}
