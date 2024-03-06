bring cloud;
bring util;
bring http;
bring "./tunnels.w" as tunnels;

let t = new tunnels.TunnelsApi(zoneName: "wingcloud.io", subDomain: util.nanoid(size: 6, alphabet: "abcdefghij"));

let api = new cloud.Api();
api.get("/", inflight () => {
  return {
    status: 200
  };
});

api.get("/with-path", inflight () => {
  return {
    status: 200
  };
});

api.post("/", inflight (req) => {
  let headers = req.headers ?? {};
  return {
    status: 200,
    body: Json.stringify({a:"b"}),
    headers: {
      "response-header-key": "response-header-value",
      "request-header-key": headers.get("request-header-key")
    }
  };
});

interface IStartTunnelsClientResult {
  inflight close(): void;
}

struct TestApiOptionResponse {
  status: num;
  headers: Map<str>?;
  body: str?;
}

struct TestApiOption {
  url: str;
  method: str;
  body: str?;
  headers: Map<str>?;
  response: TestApiOptionResponse;
}

new std.Test(inflight () => {
  util.waitUntil(inflight () => {
    try {
      return http.get(api.url).ok;
    } catch e {

    }
  });
  
  let var apiUrl = t.apiUrl();
  let target = util.env("WING_TARGET");
  let url = api.url;
  let var port = "80";
  let var hostname = url;
  if target == "sim" {
    let parts = url.split(":");
    port = parts.at(parts.length - 1);
    hostname = "127.0.0.1";
  } else {
    util.sleep(60s);
    port = "443";
    apiUrl = "https://stam.{apiUrl}";
  }

  let client = Util.startTunnelsClient(port, "stam", hostname, t.wsUrl());
  
  let testOne = inflight (t: TestApiOption) => {
    let headers = MutMap<str>{
      "X-WING-SUBDOMAIN" => "stam"
    };
    if let testHeaders = t.headers {
      for header in testHeaders.keys() {
        headers.set(header, testHeaders.get(header));
      }
    }
    let var res: http.Response? = nil;
    if t.method == "GET" {
      res = http.get(t.url, headers: headers.copy(), body: t.body);
    } elif t.method == "POST" {
      res = http.post(t.url, headers: headers.copy(), body: t.body);
    } elif t.method == "PUT" {
      res = http.put(t.url, headers: headers.copy(), body: t.body);
    } elif t.method == "DELETE" {
      res = http.delete(t.url, headers: headers.copy(), body: t.body);
    } elif t.method == "PATCH" {
      res = http.patch(t.url, headers: headers.copy(), body: t.body);
    }
    
    if let response = res {
      assert(response.status == t.response.status);

      if let headers = t.response.headers {
        for header in headers.keys() {
          assert(response.headers.get(header) == headers.get(header));
        }
      }

      assert(response.body == t.response.body ?? "OK");      
    }
  };
  

  testOne(TestApiOption{
    url: apiUrl,
    method: "GET",
    response: {
      status: 200
    }
  });

  testOne(TestApiOption{
    url: "{apiUrl}/with-path",
    method: "GET",
    response: {
      status: 200
    }
  });

  testOne(TestApiOption{
    url: apiUrl,
    method: "POST",
    body: Json.stringify({k:"v"}),
    headers: {
      "request-header-key": "request-header-value",
      // "Content-Type": "application/json",
    },
    response: {
      status: 200,
      body: Json.stringify({a:"b"}),
      headers: {
        "response-header-key": "response-header-value",
        "request-header-key": "request-header-value"
      }
    }
  });

  client.close();

  // keep resources alive while waiting for websockets to close
  util.sleep(5s);
}, timeout: 5m) as "tunnels";


class Util {
  extern "./start-tunnels-client.js" pub static inflight startTunnelsClient(port: str, subdomain: str, hostname: str, wsServer: str): IStartTunnelsClientResult;
}
