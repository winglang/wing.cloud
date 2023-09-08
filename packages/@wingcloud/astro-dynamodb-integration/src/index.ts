import { mkdir, writeFile } from "node:fs/promises";

import { type AstroIntegration } from "astro";

import { name } from "../package.json" assert { type: "json" };

import { vitePlugin } from "./vite-plugin.js";

export const dynamodb = (): AstroIntegration => {
  return {
    name,
    hooks: {
      "astro:config:setup": async ({ config, logger }) => {
        config.vite.plugins?.push(vitePlugin({ logger }));

        logger.debug("Generating virtual module type definition...");
        const dir = new URL(`.wing/${name}/`, config.root);
        await mkdir(dir, { recursive: true });
        await writeFile(
          new URL("shim.d.ts", dir),
          [
            `// Generated by ${name}. Do not edit.`,
            `declare module "virtual:${name}" {`,
            '\texport const dynamodb: import("@aws-sdk/client-dynamodb").DynamoDB;',
            "\texport const TableName: string;",
            "}",
          ].join("\n"),
        );
      },
    },
  };
};
