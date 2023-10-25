bring cloud;
bring util;
bring http;
bring "./dnsimple.w" as DNSimple;
bring "./cloudfront.w" as CloudFront;
bring "./reverse-proxy.w" as ReverseProxy;

let zoneName = "wingcloud.io";
let subDomain = "dev";

let origins = Array<CloudFront.Origin>[
  {
    domainName: "site-demo-eta.vercel.app",
    originId: "site-demo-eta",
    pathPattern: "",
  },
  {
    domainName: "site-api.vercel.app",
    originId: "api.demo.site",
    pathPattern: "/api",
  },
  {
    domainName: "site-dashboard-phi.vercel.app",
    originId: "dashboard.demo.site",
    pathPattern: "/dashboard",
  }
];

let reverseProxy = new ReverseProxy.ReverseProxy(
  origins: origins,
  subDomain: subDomain,
  zoneName: zoneName,
  aliases: ["${subDomain}.${zoneName}"],
);

struct TestsResults {
  url: str;
  status: num;
}

test "get reverse proxy url and paths" {
  log("Domain name: ${reverseProxy.url}");
  log("Urls: ${Json.stringify(reverseProxy.paths)}");
  let results = MutArray<TestsResults>[];
  let var failure = false;
  for path in reverseProxy.paths {
    let response = http.get(reverseProxy.url + path);
    if response.status != 200 {
      failure = true;
    }
    results.push({
      url: reverseProxy.url + path,
      status: response.status,
    });
  }
  log("Tests results: ${Json.stringify(results)}");
  assert(!failure);
}
