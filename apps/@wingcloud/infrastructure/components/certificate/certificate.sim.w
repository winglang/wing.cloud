bring fs;
bring "./icertificate.w" as icert;

pub struct CertificateProps {
  privateKeyFile: str;
  certificateFile: str;
}

pub class Certificate impl icert.ICertificate {
  privateKeyStr: str;
  certificateStr: str;
  new(props: CertificateProps) {
    this.privateKeyStr = fs.readFile(props.privateKeyFile);
    this.certificateStr = fs.readFile(props.certificateFile);
  }

  pub inflight certificate(): icert.Certificate {
    return {
      privateKey: this.privateKeyStr,
      certificate: this.certificateStr,
    };
  }
}