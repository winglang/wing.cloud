import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Executer } from "../executer.js";

const require = createRequire(import.meta.url);

export async function installWing(cwd: string, e: Executer) {
  const getLocalWing = async (cwd: string) => {
    try {
      // run in a different process to ignore caches
      const logfile = join(
        tmpdir(),
        "test-log-" + randomBytes(8).toString("hex"),
      );
      await e.exec(
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

  let paths = await getLocalWing(cwd);
  if (!paths) {
    const wingDir = mkdtempSync(join(tmpdir(), "wing-"));
    await e.exec("npm", ["init", "-y"], { cwd: wingDir, throwOnFailure: true });
    await e.exec("npm", ["install", "winglang"], {
      cwd: wingDir,
      throwOnFailure: true,
    });
    paths = await getLocalWing(wingDir);
    if (!paths) {
      throw new Error("failed to install winglang");
    }
  }

  return paths;
}
