import { defineMiddleware, sequence } from "astro:middleware";

/**
 * Redirects users to the home page if they are not logged in.
 */
export const redirect = defineMiddleware(
  async ({ url, redirect, locals }, next) => {
    if (
      url.pathname !== "/" &&
      url.pathname !== "/callback" &&
      !locals.userId
    ) {
      return redirect("/");
    }

    return next();
  },
);
