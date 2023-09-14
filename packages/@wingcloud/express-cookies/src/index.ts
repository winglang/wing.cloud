import { appendFileSync, writeFileSync } from "node:fs";

import * as cookie from "cookie";
import type { CookieSerializeOptions } from "cookie";
import { type Request, type Response, type RequestHandler } from "express";

import { name } from "../package.json" assert { type: "json" };

const symbol = Symbol(name);

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
      appendFileSync(
        "log.txt",
        JSON.stringify({ name, value, options }) + "\n",
      );
      // operations.push({ key: name, value, options });
      response.appendHeader(
        "Set-Cookie",
        cookie.serialize(name, value, options),
      );
    },
  };
};

export const cookiesFromRequest = (request: Request): Cookies => {
  const cookies = (request as any)[symbol];
  if (!cookies) {
    throw new Error("Cookies middleware not installed");
  }

  return cookies;
};

export const createCookiesMiddleware = (): RequestHandler => {
  return (request, response, next) => {
    const cookies = createCookies(request, response);

    Object.assign(request, {
      [symbol]: cookies,
    });

    next();
  };
};
