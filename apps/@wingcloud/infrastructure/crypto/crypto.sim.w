bring "./icrypto.w" as icrypto;
bring util;

pub class Crypto impl icrypto.ICrypto {
  key: str;

  new() {
    this.key = "seed-key";
  }

  pub inflight decrypt(data: icrypto.EncryptedData): str {
    let keyParts = data.encryptedKey.split("***");
    let decryptedKey = icrypto.decrypt(this.key, {
      iv: keyParts.at(0),
      text: keyParts.at(1)
    });
    return icrypto.decrypt(decryptedKey, data.data);
  }

  pub inflight encrypt(data: str): icrypto.EncryptedData {
    let tempKey = util.nanoid();
    let key = icrypto.encrypt(this.key, tempKey);
    let encryptedKey = "{key.iv}***{key.text}";
    let encryptedData = icrypto.encrypt(tempKey, data);
    return {
      encryptedKey: encryptedKey,
      data: encryptedData
    };
  }
}
