import * as jose from "jose";

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
    .sign(new TextEncoder().encode(options.secret));
};

export interface VerifyOptions {
  jwt: string;
  secret: string;
}

export const verify = async (options: VerifyOptions) => {
  const result = await jose.compactVerify(
    options.jwt,
    new TextEncoder().encode(options.secret),
    {
      algorithms: ["HS256"],
    },
  );

  const payload = JSON.parse(result.payload.toString());

  return {
    userId: payload.sub,
  };
};
