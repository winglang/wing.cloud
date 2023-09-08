/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GITHUB_APP_CLIENT_ID: string;
  readonly GITHUB_APP_CLIENT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "virtual:@wingcloud/vite-dynamodb-plugin" {
  export const client: import("@aws-sdk/client-dynamodb").DynamoDBClient;

  export const TableName: string;
}
