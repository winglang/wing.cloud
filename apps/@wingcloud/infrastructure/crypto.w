pub struct EncryptedData {
  iv: str;
  data: str;
}

pub class Util {
  extern "./crypto.mts" pub static inflight encrypt(key: str, data: str): EncryptedData;
  extern "./crypto.mts" pub static inflight decrypt(key: str, encrypted: EncryptedData): str;
}
