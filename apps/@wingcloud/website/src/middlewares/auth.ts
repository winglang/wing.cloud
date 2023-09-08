import { defineMiddleware } from "astro:middleware";

import { getLoggedInUserId } from "../utils/authorization.js";

/**
 * Retrieves the logged in user ID from the request cookies and sets it in the
 * Astro locals object.
 */
export const auth = defineMiddleware(async ({ cookies, locals }, next) => {
  locals.userId = await getLoggedInUserId(cookies);

  return next();
});
