pub struct Certificate {
  privateKey: str;
  certificate: str;
}

pub interface ICertificate {
  inflight certificate(): Certificate;
}
