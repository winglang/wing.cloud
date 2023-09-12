import type { Server } from "node:http";

import * as trpcExpress from "@trpc/server/adapters/express";
import express from "express";

import { createContext } from "./context.js";
import { router } from "./routers/index.js";

export { type Router } from "./routers/index.js";

export type StartOptions = {
  port?: number;
};

export const start = async (options: StartOptions) => {
  const app = express();

  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router,
      createContext,
    }),
  );

  const server = await new Promise<Server>((resolve) => {
    const server = app.listen(options.port, () => {
      resolve(server);
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Invalid address");
  }

  return { port: address.port };
};
