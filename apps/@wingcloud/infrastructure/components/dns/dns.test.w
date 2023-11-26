bring cloud;
bring util;
bring http;
bring "./dns.w" as dns;

let d = new dns.DNS(token: "");

let api = new cloud.Api();
api.get("/", inflight () => {
  return {
    status: 200,
    body: "OK"
  };
});

test "can create dns records" {
  if util.env("WING_TARGET") == "sim" {
    d.createRecords([{
      zone: "127.0.0.1",
      type: "CNAME",
      name: "127.0.0.1:55532",
      content: api.url
    }]);
  
    let res = http.get("http://127.0.0.1:55532");
    assert(res.body == "OK");
  }
}