import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { dynamodb } from "@wingcloud/astro";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "middleware",
  }),
  integrations: [tailwind(), react(), dynamodb()],
  trailingSlash: "never",
  outDir: "./lib",
});
