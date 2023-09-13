import type { Server } from "node:http";

import { DynamoDB } from "@aws-sdk/client-dynamodb";
import * as trpcExpress from "@trpc/server/adapters/express";
import express from "express";

import { type Context } from "./context.js";
import { router } from "./routers/index.js";

export { type Router } from "./routers/index.js";

export type StartOptions = {
  port?: number;
  dynamodb: {
    region: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
    endpoint: string;
    tableName: string;
  };
};

export const start = async (options: StartOptions) => {
  const app = express();

  const dynamodb = new DynamoDB(options.dynamodb);

  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router,
      createContext() {
        // return createContext({ ...context, dynamodb: options.dynamodb });
        return {
          dynamodb,
          tableName: options.dynamodb.tableName,
        } satisfies Context;
      },
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
