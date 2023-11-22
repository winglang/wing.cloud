/* eslint-disable unicorn/no-process-exit */
import { spawnSync } from "node:child_process";

import { config } from "dotenv";
import { expand } from "dotenv-expand";
import * as semver from "semver";

// Wing's `http` module requires Node.js 20.0.0 or higher.
if (!semver.satisfies(process.versions.node, ">=20.0.0")) {
  console.error(
    `Node.js version ${process.versions.node} is not supported, please use Node.js 20.0.0 or higher.`,
  );
  process.exit(1);
}

const env = expand(
  config({
    path: new URL("../.env", import.meta.url),
  }),
);

const wing = spawnSync("pnpm", ["wing", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    ...env.parsed,
  },
});

process.exit(wing.status);
