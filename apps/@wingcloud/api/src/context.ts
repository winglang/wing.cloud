import { DynamoDB } from "@aws-sdk/client-dynamodb";
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

// export const createContext = ({}: CreateExpressContextOptions) => {
//   const dynamodb = new DynamoDB({});
//   return {
//     dynamodb,
//   };
// };

// export type Context = inferAsyncReturnType<typeof createContext>;

export type Context = {
  dynamodb: DynamoDB;
  tableName: string;
};
