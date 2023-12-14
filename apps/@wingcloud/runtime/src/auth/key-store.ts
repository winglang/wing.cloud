import * as jose from "jose";

const JWT_EXPIRATION_TIME = "1h";
const AUDIENCE = "https://wing.cloud";

export interface KeyStore {
  createToken(data: Record<string, any>): Promise<string>;
}

export async function createKeyStore(
  issuer: string,
  privateKey: string,
): Promise<KeyStore> {
  return {
    createToken: async (data: Record<string, any>) => {
      const keyObject = await jose.importPKCS8(privateKey, "pem");

      return await new jose.SignJWT(data)
        .setSubject(issuer)
        .setProtectedHeader({ alg: "RS256" })
        .setIssuedAt()
        .setAudience(AUDIENCE)
        .setExpirationTime(JWT_EXPIRATION_TIME)
        .sign(keyObject);
    },
  };
}
