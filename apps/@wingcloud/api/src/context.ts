import { type DynamoDB } from "@aws-sdk/client-dynamodb";

export type Context = {
  dynamodb: DynamoDB;
  tableName: string;
};
