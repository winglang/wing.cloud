bring util;
bring "./icrypto.w" as icrypto;
bring "./crypto.sim.w" as sim;
bring "./crypto.aws.w" as aws;

pub class Crypto impl icrypto.ICrypto {
  inner: icrypto.ICrypto;
  init() {
    if util.env("WING_TARGET") == "sim" {
      this.inner = new sim.Crypto();
    } elif util.env("WING_TARGET") == "tf-aws" {
      this.inner = new aws.Crypto();
    } else {
      throw "target not supported";
    }
  }

  pub inflight encrypt(data: str): icrypto.EncryptedData {
    return this.inner.encrypt(data);
  }

  pub inflight decrypt(data: icrypto.EncryptedData): str {
    return this.inner.decrypt(data);
  }
}