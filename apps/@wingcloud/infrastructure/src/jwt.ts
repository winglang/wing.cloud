import * as jose from "jose";
import jwt from "jsonwebtoken";
const JWT_EXPIRATION_TIME = "1h";

export interface SignOptions {
  secret: string;
  userId: string;
}

export const sign = async (options: SignOptions) => {
  return await new jose.SignJWT({})
    .setSubject(options.userId)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .sign(Buffer.from(options.secret, "hex"));
};

export interface VerifyOptions {
  jwt: string;
  secret: string;
}

export const verify = async (options: VerifyOptions) => {
  const result = await jose.compactVerify(
    options.jwt,
    Buffer.from(options.secret, "hex"),
    {
      algorithms: ["HS256"],
    },
  );

  const payload = JSON.parse(result.payload.toString());

  return {
    userId: payload.sub,
  };
};

export interface SignHS256Options {
  data: Record<string, any>;
  privateKey: string;
  audience: string;
  issuer: string;
}

export const signHS256 = async ({
  data,
  privateKey,
  issuer,
  audience,
}: SignHS256Options) => {
  return jwt.sign(data, privateKey, {
    algorithm: "RS256",
    expiresIn: JWT_EXPIRATION_TIME,
    audience,
    issuer,
  });
};

export interface VerifyHS256Options {
  token: string;
  publicKey: string;
}

export const verifyHS256 = async ({ token, publicKey }: VerifyHS256Options) => {
  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    audience: "https://wing.cloud",
  });
};
