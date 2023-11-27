bring fs;
bring "@cdktf/provider-dnsimple" as dnsimple;
bring "./icertificate.w" as icert;
bring "../parameter/parameter.w" as parameter;

pub struct CertificateProps {
  certificateId: num;
  domain: str;
}

pub class Certificate impl icert.ICertificate {
  privateKeyParam: parameter.Parameter;
  certificateParam: parameter.Parameter;
  new(props: CertificateProps) {
    let cert = new dnsimple.dataDnsimpleCertificate.DataDnsimpleCertificate(domain: props.domain, certificateId: props.certificateId);
    this.privateKeyParam = new parameter.Parameter(name: "environment-server-private-key", value: cert.privateKey);
    this.certificateParam = new parameter.Parameter(name: "environment-server-certificate", value: cert.serverCertificate);
  }

  pub inflight certificate(): icert.Certificate {
    return {
      privateKey: this.certificateParam.get(),
      certificate: this.certificateParam.get(),
    };
  }
}
