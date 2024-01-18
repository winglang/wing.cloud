bring aws as awsutils;
bring "@cdktf/provider-aws" as awsprovider;
bring "./kms.w"as kms;
bring "./icrypto.w" as icrypto;

pub class Crypto impl icrypto.ICrypto {
  keyArn: str;

  new() {
    let key = new awsprovider.kmsKey.KmsKey();
    this.keyArn = key.arn;
  }

  pub inflight decrypt(data: icrypto.EncryptedData): str {
    let decryptedKey = kms.decrypt(this.keyArn, data.encryptedKey);
    return icrypto.decrypt(decryptedKey, data.data);
  }

  pub inflight encrypt(data: str): icrypto.EncryptedData {
    let key = kms.generateDataKey(this.keyArn);
    let encrypted = icrypto.encrypt(key.plainText, data);
    return {
      encryptedKey: key.ciphertextBlob,
      data: encrypted
    };
  }

  pub onLift(host: std.IInflightHost, ops: Array<str>) {
    if let host = awsutils.Function.from(host) {
      host.addPolicyStatements(awsutils.PolicyStatement {
        actions: ["kms:GenerateDataKey", "kms:Decrypt"],
        resources: ["{this.keyArn}"],
        effect: awsutils.Effect.ALLOW,
      });
    }
  }
}
