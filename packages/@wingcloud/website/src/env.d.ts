/// <reference types="astro/client" />

declare module "virtual:@wingcloud/vite-dynamodb-plugin" {
  // export const port: number;

  export const client: import("@aws-sdk/client-dynamodb").DynamoDBClient;
}
