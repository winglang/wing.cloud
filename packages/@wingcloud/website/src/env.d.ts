/// <reference types="astro/client" />

declare module "virtual:@wingcloud/astro-dynamodb-integration" {
  export const client: import("@aws-sdk/client-dynamodb").DynamoDBClient;

  export const TableName: string;
}
