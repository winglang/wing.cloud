import type { Server } from "node:http";

import { DynamoDB } from "@aws-sdk/client-dynamodb";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createCookiesMiddleware } from "@wingcloud/express-cookies";
import express from "express";

import { buildCreateContext } from "./context.js";
import { router } from "./routers/index.js";

export { type Router } from "./routers/index.js";

export type CreateAPIServerOptions = {
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

export const createAPIServer = async (options: CreateAPIServerOptions) => {
  const app = express();

  app.use(createCookiesMiddleware());

  const dynamodb = new DynamoDB(options.dynamodb);

  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router,
      createContext: buildCreateContext({
        dynamodb,
        tableName: options.dynamodb.tableName,
      }),
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
