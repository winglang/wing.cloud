#!/usr/bin/env node
import { parseArgs } from "util";
import { createServer, build } from "vite";

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

if (args.positionals.length === 0) {
  const server = await createServer({
    server: {
      port: Number(args.values.port),
    },
    clearScreen: false,
  });

  await server.listen();

  server.printUrls();

  if (args.values.open) {
    server.openBrowser();
  }
} else {
  await build({
    // clearScreen: false,
  });
}
