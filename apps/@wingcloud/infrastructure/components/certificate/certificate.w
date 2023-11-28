bring util;
bring "./icertificate.w" as icert;
bring "./certificate.sim.w" as sim;
bring "./certificate.aws.w" as aws;

pub struct CertificateProps {
  // sim
  privateKeyFile: str?;
  certificateFile: str?;
  // aws
  certificateId: num?;
  domain: str?;
}

pub class Certificate impl icert.ICertificate {
  inner: icert.ICertificate;
  new (props: CertificateProps) {
    if util.env("WING_TARGET") == "sim" {
      if let privateKeyFile = props.privateKeyFile {
        if let certificateFile = props.certificateFile {
          this.inner = new sim.Certificate(privateKeyFile: privateKeyFile, certificateFile: certificateFile);
        } else {
          throw "new certificate: missing certificateFile parameter";
        }
      } else {
        throw "new certificate: missing privateKeyFile parameter";
      }
    } else {
      if let domain = props.domain {
        if let certificateId = props.certificateId {
          this.inner = new aws.Certificate(domain: domain, certificateId: certificateId);
        } else {
          throw "new certificate: missing certificateId parameter";
        }
      } else {
        throw "new certificate: missing domain parameter";
      }
    }
  }

  pub inflight certificate(): icert.Certificate {
    return this.inner.certificate();
  }
}
