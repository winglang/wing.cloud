import * as cookie from "cookie";
import type { CookieSerializeOptions } from "cookie";
import { type Request, type Response, type RequestHandler } from "express";

import { name } from "../package.json" assert { type: "json" };

const symbol = Symbol(name);

/**
 * An interface for reading and writing cookies.
 */
export interface Cookies {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieSerializeOptions): void;
}

const createCookies = (request: Request, response: Response): Cookies => {
  const cookies = cookie.parse(request.headers.cookie ?? "");

  return {
    get(name) {
      return cookies[name];
    },
    set(name, value, options) {
      response.appendHeader(
        "Set-Cookie",
        cookie.serialize(name, value, options),
      );
    },
  };
};

/**
 * Retrieves the cookies interface from the request.
 *
 * @example
 * ```ts
 * app.get("/", (request, response) => {
 *  const cookies = cookiesFromRequest(request);
 *  const value = cookies.get("name");
 * });
 * ```
 */
export const cookiesFromRequest = (request: Request): Cookies => {
  const cookies = (request as any)[symbol];
  if (!cookies) {
    throw new Error(`Must use the [${name}] middleware first`);
  }

  return cookies;
};

/**
 * Creates a middleware that adds a cookies interface to the request.
 *
 * @example
 * ```ts
 * app.use(createCookiesMiddleware());
 * ```
 */
export const createCookiesMiddleware = (): RequestHandler => {
  return (request, response, next) => {
    const cookies = createCookies(request, response);

    Object.assign(request, {
      [symbol]: cookies,
    });

    next();
  };
};
