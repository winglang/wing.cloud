import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createKeyStore } from "./auth/key-store.js";
import { type EnvironmentContext } from "./environment.js";
import { Executer } from "./executer.js";
import { useReportStatus } from "./report-status.js";
import { Setup } from "./setup.js";
import { fileBucketSync } from "./storage/file-bucket-sync.js";
import { startServer } from "./wing/server.js";

export interface RunProps {
  context: EnvironmentContext;
  requestedPort?: number;
}

export const run = async function ({ context, requestedPort }: RunProps) {
  const logfile = join(tmpdir(), "log-" + randomBytes(8).toString("hex"));
  console.log(`Setup preview runtime. logfile ${logfile}`);

  const keyStore = await createKeyStore(context.environment.id);
  const report = useReportStatus(context, keyStore);

  const e = new Executer(logfile);

  try {
    await report("deploying");

    const { cancelSync } = fileBucketSync({
      file: logfile,
      key: context.environment.deploymentKey(),
      bucket: context.logsBucket,
    });

    const { paths, entryfilePath, testResults } = await new Setup({
      e,
      context,
    }).setup();
    
    if (testResults) {
      await report("tests", { testResults });
    } else {
      await report("error", { message: "failed to run tests" });
    }

    const { port, close } = await startServer({
      consolePath: paths["@wingconsole/app"],
      entryfilePath,
      logfile,
      keyStore,
      requestedPort,
    });

    await report("running");

    return {
      paths,
      logfile,
      port,
      close: async () => {
        cancelSync();
        await close();
      },
    };
  } catch (error: any) {
    console.error(
      "preview runtime error",
      error,
      readFileSync(logfile, "utf8"),
    );
    await report("error", { message: error.toString() });
    throw error;
  }
};
