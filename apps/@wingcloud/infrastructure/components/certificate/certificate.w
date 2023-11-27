bring util;
bring "./icertificate.w" as icert;
bring "./certificate.sim.w" as sim;
bring "./certificate.aws.w" as aws;

pub struct CertificateProps {
  // sim
  privateKeyFile: str;
  certificateFile: str;
  // aws
  certificateId: num;
  domain: str;
}

pub class Certificate impl icert.ICertificate {
  inner: icert.ICertificate;
  new (props: CertificateProps) {
    if util.env("WING_TARGET") == "sim" {
      this.inner = new sim.Certificate(privateKeyFile: props.privateKeyFile, certificateFile: props.certificateFile);
    } else {
      this.inner = new aws.Certificate(domain: props.domain, certificateId: props.certificateId);
    }
  }

  pub inflight certificate(): icert.Certificate {
    return this.inner.certificate();
  }
}
