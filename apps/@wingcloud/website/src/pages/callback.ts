import type { APIRoute } from "astro";

import { getOrCreateUser } from "../database/user.js";
import { setAuthorizationCookie } from "../utils/authorization.js";
import { getGitHubLoginFromCode } from "../utils/github.js";

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const code = url.searchParams.get("code");
  if (!code) {
    throw new Error("No code found");
  }

  const { login, tokens } = await getGitHubLoginFromCode(code);

  const userId = await getOrCreateUser(login);

  setAuthorizationCookie(userId, tokens, cookies);

  return redirect("/dashboard");
};
