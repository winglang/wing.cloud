import { defineMiddleware } from "astro:middleware";

const ALLOWED_PATHS = new Set(["/", "/callback"]);

/**
 * Redirects users to the home page if they are not logged in.
 */
export const redirect = defineMiddleware(
  async ({ url, redirect, locals }, next) => {
    const isAllowed = ALLOWED_PATHS.has(url.pathname);
    if (isAllowed) {
      return next();
    }

    if (locals.userId) {
      return next();
    }

    return redirect("/");
  },
);
