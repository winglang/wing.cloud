import { randomBytes } from "crypto";
import { tmpdir } from "os";
import { join } from "path";
import { Executer } from "../executer";
import { mkdtempSync, readFileSync } from "fs";

export async function installWing(cwd: string, e: Executer) {
  const getLocalWing = async (cwd: string) => {
    try {
      // run in a different process to ignore caches
      const logfile = join(tmpdir(), "test-log-" + randomBytes(8).toString("hex"));
      await e.exec("node", [
        "-e",
        `console.log(require.resolve('winglang', { paths: ['${cwd}'] }))`
      ], { env: {}, cwd, throwOnFailure: true, logfile, dontAppendPrefix: true, dontAppendSuffix: true });
      const wingPath = readFileSync(logfile, "utf-8").trim();
      return {
        "winglang": wingPath,
        "@wingconsole/app": require.resolve("@wingconsole/app", { paths: [cwd] }),
        "@winglang/compiler": require.resolve("@winglang/compiler", { paths: [cwd] }),
        "@winglang/sdk": require.resolve("@winglang/sdk", { paths: [cwd] })
      };
    } catch (err) { 
      return null; 
    }
  };

  let paths = await getLocalWing(cwd);
  if (!paths) {
    const wingDir = mkdtempSync(join(tmpdir(), "wing-"));
    await e.exec("npm", ["init", "-y"], { cwd: wingDir, throwOnFailure: true });
    await e.exec("npm", ["install", "winglang"], { cwd: wingDir, throwOnFailure: true });
    paths = await getLocalWing(wingDir);
    if (!paths) {
      throw new Error("failed to install winglang");
    }
  }
  
  return paths;
};
