import * as jose from "jose";

const JWT_EXPIRATION_TIME = "1h";

export interface SignOptions {
  secret: string;
  userId: string;
  username: string;
  email: string;
  isAdmin: boolean;
  expirationTime?: string;
}

export const sign = async (options: SignOptions) => {
  return await new jose.SignJWT({
    userId: options.userId,
    username: options.username,
    email: options.email,
    isAdmin: options.isAdmin,
  })
    .setSubject(options.userId)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(options.expirationTime ?? JWT_EXPIRATION_TIME)
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
    userId: payload.userId,
    username: payload.username,
    email: payload.email,
    isAdmin: payload.isAdmin,
  };
};
