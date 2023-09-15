import { parseArgs } from "node:util";

import { createAPIServer } from "@wingcloud/api";
import * as z from "zod";

const args = parseArgs({
  options: {
    port: {
      type: "string",
      short: "p",
    },
    dynamodb: {
      type: "string",
    },
  },
});

const port = Number(args.values.port);
if (Number.isNaN(port)) {
  throw new TypeError("Invalid port");
}

const dynamodbParser = z.object({
  region: z.string(),
  credentials: z.object({
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
  }),
  endpoint: z.string(),
  tableName: z.string(),
});

export type DynamodbProps = z.infer<typeof dynamodbParser>;

const dynamodb = dynamodbParser.parse(JSON.parse(args.values.dynamodb ?? "{}"));

await createAPIServer({ port, dynamodb });
