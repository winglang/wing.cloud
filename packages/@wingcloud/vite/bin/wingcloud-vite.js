#!/usr/bin/env node
import { parseArgs } from "util";
import { createServer, build } from "vite";
import { env } from "../src/env-types-plugin.js";

const args = parseArgs({
  allowPositionals: true,
  options: {
    port: {
      type: "string",
    },
    open: {
      type: "boolean",
    },
  },
});

/** @type {import("vite").InlineConfig} */
const config = {
  plugins: [env()],
  server: {
    port: Number(args.values.port),
  },
  clearScreen: false,
};

if (args.positionals.length === 0) {
  const server = await createServer(config);

  await server.listen();

  server.printUrls();

  if (args.values.open) {
    server.openBrowser();
  }
} else {
  await build(config);
}
