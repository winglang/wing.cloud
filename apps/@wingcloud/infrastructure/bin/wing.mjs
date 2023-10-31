import { spawnSync } from "node:child_process";

import { config } from "dotenv";
import { expand } from "dotenv-expand";

const env = expand(
  config({
    path: new URL("../.env", import.meta.url),
  }),
);

spawnSync("pnpm", ["wing", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    ...env.parsed,
  },
});
