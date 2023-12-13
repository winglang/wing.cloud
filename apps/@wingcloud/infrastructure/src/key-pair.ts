import * as jose from "jose";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
const JWT_EXPIRATION_TIME = "1h";
const AUDIENCE = "https://wing.cloud";

export const generate = async () => {
  const keyPair = await jose.generateKeyPair("RS256");

  const privateKey = jwkToPem(
    (await jose.exportJWK(keyPair.privateKey)) as any,
    { private: true },
  );
  const publicKey = jwkToPem((await jose.exportJWK(keyPair.publicKey)) as any);

  return {
    privateKey,
    publicKey,
  };
};

export interface SignOptions {
  data: Record<string, any>;
  privateKey: string;
  issuer: string;
}

export const sign = async ({ data, privateKey, issuer }: SignOptions) => {
  return jwt.sign(data, privateKey, {
    algorithm: "RS256",
    expiresIn: JWT_EXPIRATION_TIME,
    audience: AUDIENCE,
    issuer,
  });
};

export interface VerifyOptions {
  token: string;
  publicKey: string;
}

export const verify = async ({ token, publicKey }: VerifyOptions) => {
  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    audience: AUDIENCE,
  });
};
