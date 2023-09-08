import { type AstroIntegration } from "astro";

import { name } from "../package.json" assert { type: "json" };

import { generateVirtualModuleTypeDefinitions } from "./generate-virtual-module-type-definitions.js";
import { vitePlugin } from "./vite-plugin.js";

export const dynamodb = (): AstroIntegration => {
  return {
    name: `${name}:dynamodb`,
    hooks: {
      "astro:config:setup": async ({ config, logger, updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [vitePlugin({ logger })],
          },
        });

        await generateVirtualModuleTypeDefinitions({ config, logger });
      },
    },
  };
};
