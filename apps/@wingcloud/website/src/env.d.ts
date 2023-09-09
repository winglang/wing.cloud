/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    auth: import("./utils/authorization.js").JwtPayload | undefined;
    userId: import("./types/user.js").UserId | undefined;
  }
}
