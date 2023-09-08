import { defineMiddleware, sequence } from "astro:middleware";

import { getLoggedInUserId } from "./utils/authorization.js";

/**
 * Retrieves the logged in user ID from the request cookies and sets it in the
 * Astro locals object.
 */
const auth = defineMiddleware(async ({ cookies, locals }, next) => {
  const userId = await getLoggedInUserId(cookies);
  locals.userId = userId;

  return next();
});

/**
 * Redirects users to the home page if they are not logged in.
 */
const redirect = defineMiddleware(async ({ url, redirect, locals }, next) => {
  if (url.pathname !== "/" && !locals.userId) {
    return redirect("/");
  }

  return next();
});

export const onRequest = sequence(auth, redirect);
