import { type AstroIntegration } from "astro";

import { name } from "../package.json" assert { type: "json" };

import { generateEnvironmentTypeDefinitions } from "./generate-environment-type-definitions.js";

export const environmentTypes = (): AstroIntegration => {
  return {
    name: `${name}:environment-types`,
    hooks: {
      "astro:config:setup": async ({ config, logger }) => {
        void generateEnvironmentTypeDefinitions({ config, logger });
      },
    },
  };
};
