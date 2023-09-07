import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import dynamodb from "@wingcloud/vite-dynamodb-plugin";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "middleware",
  }),
  integrations: [tailwind(), react()],
  trailingSlash: "never",
  outDir: "./lib",
  vite: {
    plugins: [dynamodb()],
  },
});
