import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

import { runCommand } from "@winglang/sdk/lib/shared/misc.js";
import { type AstroIntegration } from "astro";
import { customAlphabet, urlAlphabet } from "nanoid";
import { type Plugin as VitePlugin } from "vite";

import { name } from "../package.json" assert { type: "json" };

import { DEFAULT_TYPES_DIRECTORY } from "./defaults.js";

export const VIRTUAL_MODULE_ID = `virtual:${name}/dynamodb`;
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

const IMAGE_NAME = "amazon/dynamodb-local:2.0.0";
const IMAGE_PORT = "8000";
const MAX_CREATE_TABLE_COMMAND_ATTEMPTS = 20;

const nanoid = customAlphabet(urlAlphabet);

export const dynamodb = (): AstroIntegration => {
  let containerName: string | undefined;
  return {
    name: `${name}:dynamodb`,
    hooks: {
      "astro:config:setup": async ({ config, logger, updateConfig }) => {
        const tableName = nanoid();
        containerName = `cloud.wing.dynamodb.${tableName}`;

        // Pull docker image.
        if (!(await runCommand("docker", ["images", "-q", IMAGE_NAME]))) {
          logger.info("Pulling DynamoDB image...");
          await runCommand("docker", ["pull", IMAGE_NAME]);
          logger.info("Done.");
        }

        // Run the container and allow docker to assign a host port dynamically.
        logger.debug("Starting container...");
        await runCommand("docker", [
          "run",
          "--detach",
          "--name",
          containerName,
          "-p",
          IMAGE_PORT,
          IMAGE_NAME,
        ]);

        // Make sure to kill the container.
        {
          // @ts-ignore-next-line
          const { default: DEATH } = await import("death");
          let isContainerDead = false;
          DEATH(() => {
            // The DEATH callback seems to be called twice.
            if (isContainerDead) {
              return;
            }

            logger.debug("Removing container...");
            execSync(`docker remove --force ${containerName}`, {
              stdio: "ignore",
            });
            isContainerDead = true;
          });
        }

        // Inspect the container to get the host port.
        logger.debug("Retrieving container port...");
        const out = await runCommand("docker", ["inspect", containerName]);
        const hostPort = Number(
          JSON.parse(out)[0].NetworkSettings.Ports[`${IMAGE_PORT}/tcp`][0]
            .HostPort,
        );

        // Create the table.
        logger.debug("Creating the table...");
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

        logger.debug(`Creating module ${VIRTUAL_MODULE_ID}...`);
        updateConfig({
          vite: {
            plugins: [
              {
                name,
                resolveId(id) {
                  if (id === VIRTUAL_MODULE_ID) {
                    return RESOLVED_VIRTUAL_MODULE_ID;
                  }
                },
                load(id) {
                  if (id === RESOLVED_VIRTUAL_MODULE_ID) {
                    return [
                      `import { DynamoDB } from "@aws-sdk/client-dynamodb";`,
                      `export const dynamodb = new DynamoDB({`,
                      `\tregion: "local",`,
                      `\tcredentials: {`,
                      `\t\taccessKeyId: "local",`,
                      `\t\tsecretAccessKey: "local",`,
                      `\t},`,
                      `\tendpoint: "http://localhost:${hostPort}",`,
                      ` });`,
                      ` export const TableName = "${tableName}";`,
                    ].join("\n");
                  }
                },
              } satisfies VitePlugin,
            ],
          },
        });

        logger.debug(`Generating type definitions for ${VIRTUAL_MODULE_ID}...`);
        const dir = new URL(`${DEFAULT_TYPES_DIRECTORY}/`, config.root);
        await mkdir(dir, { recursive: true });
        await writeFile(
          new URL("shim.d.ts", dir),
          [
            `// Generated by ${name}. Do not edit.`,
            `declare module "${VIRTUAL_MODULE_ID}" {`,
            '\texport const dynamodb: import("@aws-sdk/client-dynamodb").DynamoDB;',
            "\texport const TableName: string;",
            "}",
            "",
          ].join("\n"),
        );
      },
      "astro:server:done": async ({ logger }) => {
        if (containerName) {
          execSync(`docker remove --force ${containerName}`, {
            stdio: "ignore",
          });
        }
      },
    },
  };
};
