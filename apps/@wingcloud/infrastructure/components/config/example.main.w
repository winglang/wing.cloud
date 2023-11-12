bring cloud;
bring expect;
bring "./config.w" as c;

let config = new c.Config();
config.add("foo", "bar");

let fn = new cloud.Function(inflight (event: str) => {
    let value = config.get("foo");
    log("value: " + value);
});

test "config" {
    expect.equal(config.get("foo"), "bar");
}
