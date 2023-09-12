import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export function createContext({ req }: CreateExpressContextOptions) {
  return {};
}

export type Context = inferAsyncReturnType<typeof createContext>;
