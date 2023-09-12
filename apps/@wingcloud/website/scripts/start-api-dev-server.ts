import { parseArgs } from "node:util";

import { start } from "@wingcloud/api";

const args = parseArgs({
  options: {
    port: {
      type: "string",
      short: "p",
    },
  },
});

const port = Number(args.values.port);
if (Number.isNaN(port)) {
  throw new TypeError("Invalid port");
}

await start({ port });
