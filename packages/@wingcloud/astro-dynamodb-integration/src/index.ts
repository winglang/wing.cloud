import { type AstroIntegration } from "astro";

import { name } from "../package.json" assert { type: "json" };

import { generateTypeDefinitions } from "./generate-type-definitions.js";
import { vitePlugin } from "./vite-plugin.js";

export const dynamodb = (): AstroIntegration => {
  return {
    name,
    hooks: {
      "astro:config:setup": async ({ config, logger, updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [vitePlugin({ logger })],
          },
        });

        void generateTypeDefinitions({ config, logger });
      },
    },
  };
};
