bring cloud;
bring util;
bring http;
bring "cdktf" as cdktf;
bring "@cdktf/provider-dnsimple" as dnsimpleProvider;
bring "dnsimple.w" as DNSimple;
bring "cloudfront.w" as CloudFront;

struct ReverseProxyServerProps{
  origins: Array<CloudFront.Origin>;
}

interface IReverseProxy {
  inflight url(): str;
  inflight paths(): MutArray<str>;
}

struct ReverseProxyProps {
  zoneName: str;
  subDomain: str;
  aliases: Array<str>;
  origins: Array<CloudFront.Origin>;
}

class ReverseProxy impl IReverseProxy {
  inner: IReverseProxy?;

  init(props: ReverseProxyProps) {
    if util.env("WING_TARGET") == "sim" {
      this.inner = new ReverseProxy_sim(props);
    } elif util.env("WING_TARGET") == "tf-aws" {
      this.inner = new ReverseProxy_tfaws(props);
    }
  }

  pub inflight url(): str {
    if let inner = this.inner {
      return inner.url();
    }
    throw "not implemented";
  }

  pub inflight paths(): MutArray<str> {
    if let inner = this.inner {
      return inner.paths();
    }
    throw "not implemented";
  }
}

class ReverseProxy_tfaws impl IReverseProxy {
  aliases: Array<str>;
  origins: Array<CloudFront.Origin>;
  init(props: ReverseProxyProps) {
    this.aliases = props.aliases;
    this.origins = props.origins;
    //validated certificate
    let validatedCertificate = new DNSimple.DNSimpleValidatedCertificate(
      zoneName: props.zoneName,
      subDomain: props.subDomain
    );
    //create distribution
    let cloudFrontDist = new CloudFront.CloudFrontDistribution(
      validatedCertificate: validatedCertificate,
      aliases: props.aliases,
      origins: props.origins
    );
    //create dnsimple record
    let dnsRecord = new DNSimple.DNSimpleZoneRecord(
      zoneName: props.zoneName,
      subDomain: props.subDomain,
      recordType: "CNAME",
      ttl: 60,
      distributionUrl: cloudFrontDist.distribution.domainName
    );
  }

  pub inflight url(): str {
    return this.aliases.at(0);
  }

  pub inflight paths(): MutArray<str> {
    // do we have array.map?
    let paths = MutArray<str>[];
    for origin in this.origins {
      paths.push(origin.pathPattern);
    }
    return paths;
  }
}

class ReverseProxy_sim impl IReverseProxy {
  urlkey: str;
  bucket: cloud.Bucket;
  origins: Array<CloudFront.Origin>;

  extern "./reverse-proxy-local.mts" pub static inflight startReverseProxyServer(props: ReverseProxyServerProps): num ;

  init(props: ReverseProxyProps) {
    this.urlkey = "url.txt";
    this.bucket = new cloud.Bucket() as "Reverse Proxy Bucket";
    this.origins = props.origins;
    new cloud.Service(
      onStart: inflight () => {
        log("origins ${props.origins}");
        let port = ReverseProxy_sim.startReverseProxyServer(origins: props.origins);
        this.bucket.put(this.urlkey, "http://localhost:${port}");
      },
      onStop: inflight () => {
        log("stop!");
      }
    );
  }

  pub inflight url(): str {
    util.waitUntil(() => {
      return this.bucket.exists(this.urlkey);
    });
    return this.bucket.get(this.urlkey);
  }

  pub inflight paths(): MutArray<str> {
    // do we have array.map?
    let paths = MutArray<str>[];
    for origin in this.origins {
      paths.push(origin.pathPattern);
    }
    return paths;
  }
}

////////   test    ////////


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

let reverseProxy = new ReverseProxy(
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
  log("Domain name: ${reverseProxy.url()}");
  log("Urls: ${Json.stringify(reverseProxy.paths())}");
  let results = MutArray<TestsResults>[];
  let var failure = false;
  for path in reverseProxy.paths() {
    let response = http.get(reverseProxy.url() + path);
    if response.status != 200 {
      failure = true;
    }
    results.push({
      url: reverseProxy.url() + path,
      status: response.status,
    });
  }
  log("Tests results: ${Json.stringify(results)}");
  assert(!failure);
}

