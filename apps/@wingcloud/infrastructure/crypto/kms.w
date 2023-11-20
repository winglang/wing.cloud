pub struct GeneratedDataKey {
  plainText: str;
  ciphertextBlob: str;
}

pub class Util {
  extern "./kms.mts" pub static inflight generateDataKey(masterKeyId: str): GeneratedDataKey;
  extern "./kms.mts" pub static inflight decrypt(keyId: str, text: str): str;
  extern "./kms.mts" pub static inflight encrypt(keyId: str, text: str): str;
}

pub interface IKMS {
  inflight generateDataKey(): GeneratedDataKey;
  inflight decrypt(keyId: str, text: str): str;
  inflight encrypt(keyId: str, text: str): str;
}
