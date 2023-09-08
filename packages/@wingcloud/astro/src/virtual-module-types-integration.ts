import { type AstroIntegration } from "astro";

import { name } from "../package.json" assert { type: "json" };

import { generateVirtualModuleTypeDefinitions } from "./generate-virtual-module-type-definitions.js";

export const virtualModuleTypes = (): AstroIntegration => {
  return {
    name: `${name}:virtual-module-types`,
    hooks: {
      "astro:config:setup": async ({ config, logger }) => {
        void generateVirtualModuleTypeDefinitions({ config, logger });
      },
    },
  };
};
