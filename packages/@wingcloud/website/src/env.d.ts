/// <reference types="astro/client" />

declare module "virtual:@wingcloud/vite-dynamodb-plugin" {
  export const client: import("@aws-sdk/client-dynamodb").DynamoDBClient;

  export const TableName: string;
}
