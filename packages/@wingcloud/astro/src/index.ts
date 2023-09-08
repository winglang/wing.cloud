import { type AstroIntegration } from "astro";

import { name } from "../package.json" assert { type: "json" };

import { generateEnvironmentTypeDefinitions } from "./generate-environment-type-definitions.js";
import { generateVirtualModuleTypeDefinitions } from "./generate-virtual-module-type-definitions.js";
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

        void generateVirtualModuleTypeDefinitions({ config, logger });
        void generateEnvironmentTypeDefinitions({ config, logger });
      },
    },
  };
};
