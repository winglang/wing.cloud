import { type DynamoDB } from "@aws-sdk/client-dynamodb";
import { type CreateExpressContextOptions } from "@trpc/server/adapters/express";

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
  return ({
    req: request,
    res: response,
  }: CreateExpressContextOptions): Context => {
    // TODO: Get userId from JWT cookie.
    return {
      dynamodb: options.dynamodb,
      tableName: options.tableName,
      request,
      response,
    };
  };
};
