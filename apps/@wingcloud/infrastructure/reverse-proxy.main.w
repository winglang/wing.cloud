bring cloud;
bring util;
bring "cdktf" as cdktf;
bring "@cdktf/provider-dnsimple" as dnsimpleProvider;
bring "./src/reverse-proxy/dnsimple.w" as DNSimple;
bring "./src/reverse-proxy/cloudfront.w" as CloudFront;

if util.env("WING_TARGET") == "tf-aws" {
  let DNSIMPLE_TOKEN = new cdktf.TerraformVariable({
    type: "string",
  }) as "DNSIMPLE_TOKEN";
  let DNSIMPLE_ACCOUNT = new cdktf.TerraformVariable({
    type: "string",
  }) as "DNSIMPLE_ACCOUNT";
  
  new dnsimpleProvider.provider.DnsimpleProvider({
    token: "${DNSIMPLE_TOKEN}",
    account: "${DNSIMPLE_ACCOUNT}"
  });
}


struct ReverseProxyServerProps{
  origins: Array<CloudFront.Origin>;
}

class Utils {
  extern "./src/reverse-proxy/reverse-proxy-local.mts" pub static inflight startReverseProxyServer(props: ReverseProxyServerProps): num ;
}

interface IReverseProxy {
  inflight url(): str;
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
}

class ReverseProxy_tfaws impl IReverseProxy {
  aliases: Array<str>;
  init(props: ReverseProxyProps) {
    this.aliases = props.aliases;
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
}

class ReverseProxy_sim impl IReverseProxy {
  urlkey: str;
  bucket: cloud.Bucket;

  init(props: ReverseProxyProps) {
    this.urlkey = "url.txt";
    this.bucket = new cloud.Bucket() as "Reverse Proxy Bucket";
    new cloud.Service(
      onStart: inflight () => {
        log("origins ${props.origins}");
        let port = Utils.startReverseProxyServer(origins: props.origins);
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

// timing issues
test "get url" {
  log(reverseProxy.url());
}

//terraform apply -var="DNSIMPLE_ACCOUNT=137210" -var="DNSIMPLE_TOKEN=dnsimple_a_JenZpXBioFsHX5uyPhcRrH2jmixyKqLo"
//DNSIMPLE_TOKEN=dnsimple_a_JenZpXBioFsHX5uyPhcRrH2jmixyKqLo
//DNSIMPLE_ACCOUNT=137210