import * as jose from "jose";

const JWT_EXPIRATION_TIME = "1h";
const AUDIENCE = "https://wing.cloud";

export const generate = async () => {
  const keyPair = await jose.generateKeyPair("RS256");

  return {
    privateKey: await jose.exportPKCS8(keyPair.privateKey),
    publicKey: await jose.exportSPKI(keyPair.publicKey),
  };
};

export interface SignOptions {
  data: Record<string, any>;
  privateKey: string;
  issuer: string;
}

export const sign = async ({ data, privateKey, issuer }: SignOptions) => {
  const keyObject = await jose.importPKCS8(privateKey, "pem");

  return await new jose.SignJWT(data)
    .setSubject(issuer)
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setAudience(AUDIENCE)
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .sign(keyObject);
};

export interface VerifyOptions {
  token: string;
  publicKey: string;
}

export const verify = async ({ token, publicKey }: VerifyOptions) => {
  const keyObject = await jose.importSPKI(publicKey, "pem");

  const result = await jose.compactVerify(token, keyObject, {
    algorithms: ["RS256"],
  });

  return JSON.parse(new TextDecoder().decode(result.payload));
};
