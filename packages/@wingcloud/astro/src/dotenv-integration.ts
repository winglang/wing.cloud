import { mkdir, readFile, writeFile } from "node:fs/promises";

import { type AstroIntegration } from "astro";
import { parse } from "dotenv";

import { name } from "../package.json" assert { type: "json" };

import { DEFAULT_TYPES_DIRECTORY } from "./defaults.js";

export const dotenv = (): AstroIntegration => {
  return {
    name: `${name}:dotenv`,
    hooks: {
      "astro:config:setup": async ({ config, logger }) => {
        logger.debug("Generating dotenv type definitions...");
        const env = parse(await readFile(new URL(".env.example", config.root)));

        let dotenvDts = [
          `// Generated by ${name}. Do not edit.`,
          "interface ImportMetaEnv {",
        ];
        for (const [key, value] of Object.entries(env)) {
          const type = typeof value === "string" ? "string" : "unknown";
          dotenvDts.push(
            `\t/** Generated by \`${name}\` based on \`.env.example\`. */`,
            `\treadonly ${key}: ${type};`,
          );
        }
        dotenvDts.push(
          "}",
          "",
          "interface ImportMeta {",
          "\treadonly env: ImportMetaEnv;",
          "}",
          "",
        );

        const dir = new URL(`${DEFAULT_TYPES_DIRECTORY}/`, config.root);
        await mkdir(dir, { recursive: true });
        await writeFile(new URL("dotenv.d.ts", dir), dotenvDts.join("\n"));
      },
    },
  };
};
