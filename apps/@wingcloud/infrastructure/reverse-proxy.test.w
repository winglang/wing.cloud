bring cloud;
bring util;
bring http;
bring "./reverse-proxy.w" as ReverseProxy;

let origins = [
  ReverseProxy.Origin {
    domainName: "site-api.vercel.app",
    pathPattern: "/api",
  },
  ReverseProxy.Origin {
    domainName: "site-dashboard-phi.vercel.app",
    pathPattern: "/dashboard",
  },
  ReverseProxy.Origin {
    domainName: "site-demo-eta.vercel.app",
    pathPattern: "*",
  },
];

let reverseProxy = new ReverseProxy.ReverseProxy(
  origins: origins,
);

struct TestsResults {
  url: str;
  status: num;
}

test "get reverse proxy url and paths" {
  log("Domain name: {reverseProxy.url}");
  log("Urls: {Json.stringify(origins)}");
  let results = MutArray<TestsResults>[];
  let var failure = false;
  let paths = ["/api", "/dashboard", "/"];
  for path in paths {
    let url = reverseProxy.url + path;
    let response = http.get(url);
    if response.status != 200 {
      failure = true;
    }
    results.push({
      url: url,
      status: response.status,
    });
  }
  log("Tests results: {Json.stringify(results)}");
  assert(!failure);
}
