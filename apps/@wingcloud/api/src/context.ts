import { type DynamoDB } from "@aws-sdk/client-dynamodb";
import { type CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { cookiesFromRequest } from "@wingcloud/express-cookies";

import { getLoggedInUserId } from "./services/auth.js";
import type { UserId } from "./types/user.js";

export type Context = {
  dynamodb: DynamoDB;
  tableName: string;
  request: CreateExpressContextOptions["req"];
  response: CreateExpressContextOptions["res"];
  userId?: UserId;
};

export type BuildCreateContextOptions = {
  dynamodb: DynamoDB;
  tableName: string;
};

export const buildCreateContext = (options: BuildCreateContextOptions) => {
  return async ({
    req: request,
    res: response,
  }: CreateExpressContextOptions) => {
    const cookies = cookiesFromRequest(request);
    const userId = await getLoggedInUserId(cookies);
    return {
      dynamodb: options.dynamodb,
      tableName: options.tableName,
      request,
      response,
      userId,
    } satisfies Context;
  };
};
