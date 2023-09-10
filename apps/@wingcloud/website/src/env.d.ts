/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    userId: import("./types/user.js").UserId | undefined;
  }
}
