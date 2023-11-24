import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import which from "which";

import { Executer } from "../executer.js";

const require = createRequire(import.meta.url);

export async function installWing(cwd: string, executer: Executer) {
  const getWingPaths = async (cwd: string) => {
    try {
      // run in a different process to ignore caches
      const logfile = join(
        tmpdir(),
        "test-log-" + randomBytes(8).toString("hex"),
      );
      await executer.exec(
        "node",
        [
          "-e",
          `console.log(require.resolve('winglang', { paths: ['${cwd}'] }))`,
        ],
        {
          env: {},
          cwd,
          throwOnFailure: true,
          logfile,
          dontAppendPrefix: true,
          dontAppendSuffix: true,
        },
      );
      const wingPath = readFileSync(logfile, "utf8").trim();
      return {
        winglang: wingPath,
        "@wingconsole/app": require.resolve("@wingconsole/app", {
          paths: [cwd],
        }),
        "@winglang/compiler": require.resolve("@winglang/compiler", {
          paths: [cwd],
        }),
        "@winglang/sdk": require.resolve("@winglang/sdk", { paths: [cwd] }),
      };
    } catch {
      return;
    }
  };

  // try to find wing locally (if installed by package.json)
  // otherwise try to find it globally
  // otherwise install wing
  let paths = await getWingPaths(cwd);
  if (!paths) {
    const wingPath = await getGlobalWing();
    if (wingPath) {
      paths = await getWingPaths(dirname(wingPath));
    }

    if (!paths) {
      const wingDir = mkdtempSync(join(tmpdir(), "wing-"));
      await executer.exec("npm", ["init", "-y"], {
        cwd: wingDir,
        throwOnFailure: true,
      });
      await executer.exec("npm", ["install", "winglang"], {
        cwd: wingDir,
        throwOnFailure: true,
      });
      paths = await getWingPaths(wingDir);
      if (!paths) {
        throw new Error("failed to install winglang");
      }
    }
  }

  return paths;
}

export async function getGlobalWing() {
  const wingBin = process.env["WING_BIN"];
  if (wingBin) {
    return realpathSync(wingBin);
  }

  try {
    const wing = await which("wing");
    return realpathSync(wing);
  } catch {
    return;
  }
}
