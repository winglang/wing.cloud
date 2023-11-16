pub struct Data {
  iv: str;
  text: str;
}

pub struct EncryptedData {
  encryptedKey: str;
  data: Data;
}

pub interface ICrypto {
  inflight encrypt(data: str): EncryptedData;
  inflight decrypt(data: EncryptedData): str;
}

pub class Util {
  extern "./crypto.mts" pub static inflight encrypt(key: str, data: str): Data;
  extern "./crypto.mts" pub static inflight decrypt(key: str, encrypted: Data): str;
}
