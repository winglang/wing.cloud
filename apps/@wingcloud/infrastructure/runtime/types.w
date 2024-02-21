bring "../components/certificate/icertificate.w" as certificate;

pub struct Message {
  repo: str;
  sha: str;
  entrypoint: str;
  appId: str;
  environmentId: str;
  token: str?;
  secrets: Map<str>;
  certificate: certificate.Certificate;
  privateKey: str;
}
