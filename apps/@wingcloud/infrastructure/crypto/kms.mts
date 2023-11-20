import kms from "@aws-sdk/client-kms";

export const generateDataKey = async (keyId: string) => {
  const client = new kms.KMS();
  const res = await client.generateDataKey({
    KeyId: keyId,
    KeySpec: "AES_256"
  });
  if (res.CiphertextBlob && res.Plaintext) {
    const dataKey = {
      plainText: Buffer.from(res.Plaintext).toString("base64"),
      ciphertextBlob: Buffer.from(res.CiphertextBlob).toString("base64")
    };
    return dataKey;
  } else {
    return undefined;
  }
};

export const decrypt = async (keyId: string, text: string) => {
  const client = new kms.KMS();
  const res = await client.decrypt({
    KeyId: keyId,
    CiphertextBlob: Buffer.from(text, "base64")
  })
  if (res.Plaintext) {
    return Buffer.from(res.Plaintext).toString("base64");
  } else {
    return undefined;
  }
};

export const encrypt = async (keyId: string, text: string) => {
  const client = new kms.KMS();
  const res = await client.encrypt({
    KeyId: keyId,
    Plaintext: Buffer.from(text, "base64"),
  })
  if (res.CiphertextBlob) {
    return Buffer.from(res.CiphertextBlob).toString("base64");
  } else {
    return undefined;
  }
};
