bring cloud;
bring util;
bring http;
bring sim;
bring "./dnsimple.w" as DNSimple;
bring "./cloudfront.w" as CloudFront;

struct Origin {
  pathPattern: str;
  domainName: str;
}

struct ReverseProxyServerProps{
  origins: Array<Origin>;
  port: num?;
}

struct ReverseProxyProps {
  origins: Array<Origin>;
  port: num?;
}

pub class ReverseProxy {
  pub url: str;

  new(props: ReverseProxyProps) {
    if util.env("WING_TARGET") == "sim" {
      let inner = new ReverseProxy_sim(props);
      this.url = inner.url;
    } else {
      throw "ReverseProxy is not implemented for ${util.env("WING_TARGET")}";
    }
  }
}

// class ReverseProxy_tfaws {
//   pub url: str;
//   pub paths: Array<str>;
//   aliases: Array<str>;
//   origins: Array<CloudFront.Origin>;
//   new(props: ReverseProxyProps) {
//     this.aliases = props.aliases;
//     this.origins = props.origins;
//     //validated certificate
//     let validatedCertificate = new DNSimple.DNSimpleValidatedCertificate(
//       zoneName: props.zoneName,
//       subDomain: props.subDomain
//     );
//     //create distribution
//     let cloudFrontDist = new CloudFront.CloudFrontDistribution(
//       validatedCertificate: validatedCertificate,
//       aliases: props.aliases,
//       origins: props.origins
//     );
//     //create dnsimple record
//     let dnsRecord = new DNSimple.DNSimpleZoneRecord(
//       zoneName: props.zoneName,
//       subDomain: props.subDomain,
//       recordType: "CNAME",
//       ttl: 60,
//       distributionUrl: cloudFrontDist.distribution.domainName
//     );

//     this.url = props.aliases.tryAt(0) ?? cloudFrontDist.distribution.domainName;

//     let paths = MutArray<str>[];
//     for origin in this.origins {
//       paths.push(origin.pathPattern);
//     }
//     this.paths = paths.copy();
//   }
// }

struct SimReverseProxyResult {
  port: num;
  close: inflight (): void;
}

class ReverseProxy_sim {
  pub url: str;

  extern "./reverse-proxy-local.mts" pub static inflight startReverseProxyServer(props: ReverseProxyServerProps): SimReverseProxyResult;

  new(props: ReverseProxyProps) {
    let state = new sim.State();
    new cloud.Service(inflight () => {
      let result = ReverseProxy_sim.startReverseProxyServer(origins: props.origins, port: props.port);
      state.set("url", "http://localhost:${result.port}");
      return inflight () => {
        result.close();
      };
    });

    this.url = state.token("url");
  }
}
