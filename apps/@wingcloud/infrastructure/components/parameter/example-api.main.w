bring cloud;
bring expect;
bring "./parameter.w" as p;

let api = new cloud.Api();
let q = new cloud.Queue();

let param = new p.Parameter(
    name: "foo",
    value: api.url
);

q.setConsumer(inflight (event: str) => {
    let value = param.get();
    log("value: " + value);
});

test "config" {
    expect.equal(param.get(), "bar");
}