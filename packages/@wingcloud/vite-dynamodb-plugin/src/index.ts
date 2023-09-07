import { execSync } from "node:child_process";

import { runCommand } from "@winglang/sdk/lib/shared/misc.js";
import { customAlphabet, urlAlphabet } from "nanoid";
import { type Plugin } from "vite";

import { name } from "../package.json" assert { type: "json" };

const VIRTUAL_MODULE_ID = "virtual:@wingcloud/vite-dynamodb-plugin";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

const imageName = "amazon/dynamodb-local:2.0.0";
const imagePort = "8000";

const nanoid = customAlphabet(urlAlphabet);

export default function (): Plugin {
  let hostPort: number | undefined;
  const containerName = `cloud.wing.dynamodb.${nanoid()}`;
  return {
    name,
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        // return `export const port = ${hostPort}`;
        return `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

        export const client = new DynamoDBClient({
          region: "local",
          credentials: {
            accessKeyId: "local",
            secretAccessKey: "local",
          },
          endpoint: "http://localhost:${hostPort}",
        });`;
      }
    },
    async buildStart(options) {
      // Pull docker image
      await runCommand("docker", ["pull", imageName]);

      // Run the container and allow docker to assign a host port dynamically
      await runCommand("docker", [
        "run",
        "--detach",
        "--name",
        containerName,
        "-p",
        imagePort,
        imageName,
      ]);

      // Make sure to kill the container
      // @ts-ignore-next-line
      const { default: DEATH } = await import("death");
      let isContainerDead = false;
      DEATH(() => {
        // The DEATH callback seems to be called twice.
        if (isContainerDead) {
          return;
        }

        execSync(`docker remove --force ${containerName}`);
        isContainerDead = true;
      });

      // Inspect the container to get the host port
      const out = await runCommand("docker", ["inspect", containerName]);
      hostPort = Number(
        JSON.parse(out)[0].NetworkSettings.Ports[`${imagePort}/tcp`][0]
          .HostPort,
      );

      // Create the table
      const { DynamoDBClient, CreateTableCommand } = await import(
        "@aws-sdk/client-dynamodb"
      );
      const client = new DynamoDBClient({
        region: "local",
        credentials: {
          accessKeyId: "local",
          secretAccessKey: "local",
        },
        endpoint: `http://localhost:${hostPort}`,
      });
      await client.send(
        new CreateTableCommand({
          TableName: nanoid(),
          AttributeDefinitions: [
            {
              AttributeName: "pk",
              AttributeType: "S",
            },
            {
              AttributeName: "sk",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            { AttributeName: "pk", KeyType: "HASH" },
            { AttributeName: "sk", KeyType: "RANGE" },
          ],
          BillingMode: "PAY_PER_REQUEST",
        }),
      );
    },
  };
}
