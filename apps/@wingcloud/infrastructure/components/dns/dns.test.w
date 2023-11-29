bring cloud;
bring util;
bring http;
bring math;
bring "./dns.w" as dns;

let d = new dns.DNS({});

let api = new cloud.Api();
api.get("/", inflight () => {
  return {
    status: 200,
    body: "OK"
  };
});

test "can create dns records" {
  if util.env("WING_TARGET") == "sim" {
    let port = math.floor(math.random() * 10000 + 50000);
    d.createRecords([{
      zone: "127.0.0.1",
      type: "CNAME",
      name: "127.0.0.1:{port}",
      content: api.url
    }]);
  
    let res = http.get("http://127.0.0.1:{port}");
    assert(res.body == "OK");
  }
}