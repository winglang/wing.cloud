import { spawn, spawnSync } from "node:child_process";

import getPort from "get-port";
import { customAlphabet, urlAlphabet } from "nanoid";
import fetch from "node-fetch";
import { type Plugin } from "vite";

import { type DynamodbProps } from "./start-api-dev-server.js";

const MAX_API_PING_ATTEMPTS = 20;
const IMAGE_NAME = "amazon/dynamodb-local:2.0.0";
const IMAGE_PORT = "8000";
const MAX_CREATE_TABLE_COMMAND_ATTEMPTS = 20;

const nanoid = customAlphabet(urlAlphabet);

export const api = (): Plugin => {
  let port: number | undefined;
  let server: ReturnType<typeof spawn> | undefined;
  let containerName: string | undefined;
  return {
    name: "api",
    async configureServer(context) {
      server?.kill();

      port = await getPort();
      context.config.server.proxy = {
        ...context.config.server.proxy,
        "/trpc": {
          target: `http://localhost:${port}`,
          changeOrigin: true,
        },
      };
    },
    async buildStart() {
      this.debug("buildStart");

      // Pull the Dynamodb docker image.
      if (
        !spawnSync("docker", ["images", "-q", IMAGE_NAME]).stdout.toString()
      ) {
        this.info("Pulling DynamoDB image...");
        spawnSync("docker", ["pull", IMAGE_NAME]);
        this.info("Done.");
      }

      // Run the Dynamodb container.
      const tableName = nanoid();
      containerName = `cloud.wing.dynamodb.${tableName}`;
      spawnSync("docker", [
        "run",
        "--detach",
        "--name",
        containerName,
        "-p",
        IMAGE_PORT,
        IMAGE_NAME,
      ]);

      // Inspect the container to get the host port.
      this.debug("Retrieving container port...");
      const out = spawnSync("docker", [
        "inspect",
        containerName,
      ]).stdout.toString();
      const dynamodbPort = Number(
        JSON.parse(out)[0].NetworkSettings.Ports[`${IMAGE_PORT}/tcp`][0]
          .HostPort,
      );

      // Create the table.
      this.debug("Creating the table...");
      const dynamodbProps = {
        region: "local",
        credentials: {
          accessKeyId: "local",
          secretAccessKey: "local",
        },
        endpoint: `http://localhost:${dynamodbPort}`,
        tableName,
      } satisfies DynamodbProps;
      {
        const { DynamoDBClient, CreateTableCommand } = await import(
          "@aws-sdk/client-dynamodb"
        );
        const client = new DynamoDBClient(dynamodbProps);

        const createTableCommand = new CreateTableCommand({
          TableName: tableName,
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
        });

        // The DynamoDB process might take some time to start.
        let attemptNumber = 0;
        while (true) {
          try {
            await client.send(createTableCommand);
            break;
          } catch (error) {
            if (++attemptNumber >= MAX_CREATE_TABLE_COMMAND_ATTEMPTS) {
              throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
      }

      // Start the API dev server.
      server = spawn(
        "pnpm",
        [
          "tsx",
          "watch",
          "--clear-screen=0",
          new URL("start-api-dev-server.ts", import.meta.url).pathname,
          `--port=${port}`,
          `--dynamodb=${JSON.stringify(dynamodbProps)}`,
        ],
        {
          detached: true,
        },
      );
      server.stdout?.on("data", (data) =>
        console.log(`[@wingcloud/api] ${data.toString()}`),
      );
      server.stderr?.on("data", (data) =>
        console.log(`[@wingcloud/api] ${data.toString()}`),
      );

      // `tsx` needs some time to parse and execute the server file.
      let attempts = 0;
      while (attempts++ < MAX_API_PING_ATTEMPTS) {
        try {
          const response = await fetch(`http://localhost:${port}/`);
          if (response.ok) {
            break;
          }
        } catch {}
        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
      }
    },
    closeBundle() {
      server?.kill();

      if (containerName) {
        this.debug("Removing container...");
        spawnSync("docker", ["remove", "--force", containerName], {
          stdio: "ignore",
        });
      }
    },
  };
};
