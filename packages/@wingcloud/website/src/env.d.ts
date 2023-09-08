/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly APP_SECRET: string;
  readonly GITHUB_APP_CLIENT_ID: string;
  readonly GITHUB_APP_CLIENT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    userId: import("./database/user.js").UserId | undefined;
  }
}
