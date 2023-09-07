import { type AstroIntegration } from "astro";

import { name } from "../package.json" assert { type: "json" };

import { vitePlugin } from "./vite-plugin.js";

export const dynamodb = (): AstroIntegration => {
  return {
    name,
    hooks: {
      "astro:config:setup": ({ config, logger }) => {
        config.vite.plugins?.push(vitePlugin({ logger }));
      },
    },
  };
};
