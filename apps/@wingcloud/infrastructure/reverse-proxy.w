bring cloud;
bring util;
bring http;
bring sim;
bring "./dnsimple.w" as DNSimple;
bring "./cloudfront.w" as CloudFront;

struct ReverseProxyServerProps{
  origins: Array<CloudFront.Origin>;
  port: num?;
}

struct ReverseProxyProps {
  zoneName: str;
  subDomain: str;
  aliases: Array<str>;
  origins: Array<CloudFront.Origin>;
  port: num?;
}

pub class ReverseProxy {
  pub url: str;
  pub paths: Array<str>;

  init(props: ReverseProxyProps) {
    if util.env("WING_TARGET") == "sim" {
      let inner = new ReverseProxy_sim(props);
      this.url = inner.url;
      this.paths = inner.paths;
    } elif util.env("WING_TARGET") == "tf-aws" {
      let inner = new ReverseProxy_tfaws(props);
      this.url = inner.url;
      this.paths = inner.paths;
    } else {
      throw "ReverseProxy is not implemented for ${util.env("WING_TARGET")}";
    }
  }
}

class ReverseProxy_tfaws {
  pub url: str;
  pub paths: Array<str>;
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

    this.url = props.aliases.tryAt(0) ?? cloudFrontDist.distribution.domainName;

    let paths = MutArray<str>[];
    for origin in this.origins {
      paths.push(origin.pathPattern);
    }
    this.paths = paths.copy();
  }
}

struct SimReverseProxyResult {
  port: num;
  close: inflight (): void;
}

class ReverseProxy_sim {
  pub url: str;
  pub paths: Array<str>;
  state: sim.State;
  origins: Array<CloudFront.Origin>;

  extern "./reverse-proxy-local.mts" pub static inflight startReverseProxyServer(props: ReverseProxyServerProps): SimReverseProxyResult;

  init(props: ReverseProxyProps) {
    this.state = new sim.State();
    this.origins = props.origins;
    new cloud.Service(inflight () => {
      for origin in props.origins {
        log("origin domainName=${origin.domainName} originPath=${origin.originPath}");
      }
      let result = ReverseProxy_sim.startReverseProxyServer(origins: props.origins, port: props.port);
      this.state.set("url", "http://localhost:${result.port}");
      return inflight () => {
        result.close();
      };
    });

    this.url = this.state.token("url");

    let paths = MutArray<str>[];
    for origin in this.origins {
      paths.push(origin.pathPattern);
    }
    this.paths = paths.copy();
  }
}
