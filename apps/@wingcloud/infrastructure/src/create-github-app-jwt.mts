import jwt from "jsonwebtoken";

export const createGithubAppJwt = async (appId: string, privateKey: string) => {
  const now = Math.floor(Date.now() / 1000) - 30;
  const expiration = now + 60 * 10; // JWT expiration time (10 minute maximum)

  const payload = {
    iat: now,
    exp: expiration,
    iss: appId,
  };

  return jwt.sign(payload, privateKey.trim().replaceAll("\\n", "\n"), {
    algorithm: "RS256",
  });
};
