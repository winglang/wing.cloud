import jwt from "jsonwebtoken";

export interface KeyStore {
  createToken(data: Record<string, any>): Promise<string>;
}

export async function createKeyStore(
  issuer: string,
  privateKey: string,
): Promise<KeyStore> {
  return {
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
