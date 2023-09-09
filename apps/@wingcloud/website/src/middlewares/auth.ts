import { defineMiddleware } from "astro:middleware";

import { getAuthorizationPayload } from "../utils/authorization.js";

/**
 * Retrieves the logged in user ID from the request cookies and sets it in the
 * Astro locals object.
 */
export const auth = defineMiddleware(async ({ cookies, locals }, next) => {
  locals.auth = await getAuthorizationPayload(cookies);
  locals.userId = locals.auth?.sub;

  return next();
});
