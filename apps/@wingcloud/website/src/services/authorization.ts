import type { AstroCookies } from "astro";
import * as jose from "jose";

import type { UserId } from "../types/user.js";

import type { GitHubTokens } from "./github.js";

const APP_SECRET = new TextEncoder().encode(import.meta.env.APP_SECRET);
const JWT_EXPIRATION_TIME = "1h";
export const AUTH_COOKIE_NAME = "Authorization";

export type JwtPayload = {
  sub: UserId;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

export const createAuthorizationJwt = async (
  userId: UserId,
  tokens: GitHubTokens,
) => {
  return await new jose.SignJWT({
    sub: userId,
    accessToken: tokens.access_token,
    expiresIn: tokens.expires_in,
    refreshToken: tokens.refresh_token,
    refreshTokenExpiresIn: tokens.refresh_token_expires_in,
  } satisfies JwtPayload)
    // .setSubject(userId)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .sign(APP_SECRET);
};

export const setAuthorizationCookie = async (
  userId: UserId,
  tokens: GitHubTokens,
  cookies: AstroCookies,
) => {
  const jwt = await createAuthorizationJwt(userId, tokens);

  cookies.set(AUTH_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
};

export const getAuthorizationPayload = async (cookies: AstroCookies) => {
  const jwt = cookies.get(AUTH_COOKIE_NAME);
  if (!jwt) {
    return;
  }

  const verifyResult = await jose.compactVerify(jwt.value, APP_SECRET, {
    algorithms: ["HS256"],
  });

  return JSON.parse(verifyResult.payload.toString()) as JwtPayload;
};

export const getSignedInUserId = async (cookies: AstroCookies) => {
  const payload = await getAuthorizationPayload(cookies);

  return payload?.sub;
};
