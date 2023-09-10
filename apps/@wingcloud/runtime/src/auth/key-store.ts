import jose from "node-jose";
import jwkToPem from "jwk-to-pem";
import jwt from "jsonwebtoken";

export interface KeyStore {
  publicKey(): string;
  createToken(data: Record<string, string>): Promise<string>;
};

export async function createKeyStore(issuer: string): Promise<KeyStore> {
  const keyStore = jose.JWK.createKeyStore();
  await keyStore.generate("RSA", 2048, { alg: "RS256", use: "sig" });
  const key = keyStore.all({ use: 'sig' })[0];
  
  if (!key) {
    throw Error("failed to create signing keys");
  }
  
  const privateKey = jwkToPem(key.toJSON(true) as any, { private: true })

  return {
    publicKey: () => {
      return jwkToPem(keyStore.toJSON() as any);
    },
    createToken: async (data: Record<string, string>) => {
      // jwt.verify(token, publicKey);
      return jwt.sign(data, privateKey, {
        algorithm: 'RS256',
        expiresIn: "1h",
        audience: "https://wing.cloud",
        issuer
      });
    }
  }
};
