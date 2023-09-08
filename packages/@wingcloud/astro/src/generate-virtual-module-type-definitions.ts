import { mkdir, writeFile } from "node:fs/promises";

import { type AstroConfig, type AstroIntegrationLogger } from "astro";

import { name } from "../package.json" assert { type: "json" };

import { VIRTUAL_MODULE_ID } from "./vite-plugin.js";

export type GenerateVirtualModuleTypeDefintionsOptions = {
  config: AstroConfig;
  logger: AstroIntegrationLogger;
};

export const generateVirtualModuleTypeDefinitions = async ({
  config,
  logger,
}: GenerateVirtualModuleTypeDefintionsOptions) => {
  logger.debug(`Generating type definitions for ${VIRTUAL_MODULE_ID}...`);
  const dir = new URL(`.wing/${name}/`, config.root);
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
};
