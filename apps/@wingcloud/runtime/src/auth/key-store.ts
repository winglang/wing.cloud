import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import * as jose from "jose";

export interface KeyStore {
  publicKey(): string;
  createToken(data: Record<string, any>): Promise<string>;
}

export async function createKeyStore(issuer: string): Promise<KeyStore> {
  const keyStore = await jose.generateKeyPair("RS256");

  const privateKey = jwkToPem(await jose.exportJWK(keyStore.privateKey) as any, { private: true });
  const publicKey = jwkToPem(await jose.exportJWK(keyStore.publicKey) as any);

  return {
    publicKey: () => {
      return publicKey;
    },
    createToken: async (data: Record<string, any>) => {
      return jwt.sign(data, privateKey, {
        algorithm: "RS256",
        expiresIn: "1h",
        audience: "https://wing.cloud",
        issuer,
      });
    },
  };
}
