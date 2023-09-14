import type { Cookies } from "@wingcloud/express-cookies";
import * as jose from "jose";

import type { UserId } from "../types/user.js";

import type { GitHubTokens } from "./github.js";

const APP_SECRET = () => new TextEncoder().encode(process.env["APP_SECRET"]);
const JWT_EXPIRATION_TIME = "1h";
export const AUTH_COOKIE_NAME = "Authorization";

export const createAuthorizationJwt = async (
  userId: UserId,
  tokens: GitHubTokens,
) => {
  return await new jose.SignJWT({
    accessToken: tokens.access_token,
    expiresIn: tokens.expires_in,
    refreshToken: tokens.refresh_token,
    refreshTokenExpiresIn: tokens.refresh_token_expires_in,
  })
    .setSubject(userId)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .sign(APP_SECRET());
};

export const setAuthorizationCookie = async (
  userId: UserId,
  tokens: GitHubTokens,
  cookies: Cookies,
) => {
  const jwt = await createAuthorizationJwt(userId, tokens);

  cookies.set(AUTH_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
};

export const getLoggedInUserId = async (cookies: Cookies) => {
  const jwt = cookies.get(AUTH_COOKIE_NAME);
  if (!jwt) {
    return;
  }

  const verifyResult = await jose.compactVerify(jwt, APP_SECRET, {
    algorithms: ["HS256"],
  });

  const payload = JSON.parse(verifyResult.payload.toString());

  return payload.sub as UserId;
};
