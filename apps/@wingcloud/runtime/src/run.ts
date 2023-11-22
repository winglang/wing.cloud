import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createKeyStore } from "./auth/key-store.js";
import { BucketLogger } from "./bucket-logger.js";
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
  const keyStore = await createKeyStore(context.environment.id);
  const report = useReportStatus(context, keyStore);

  const deployLogger = new BucketLogger({
    key: context.environment.deploymentKey(),
    bucket: context.logsBucket,
  });

  const runtimeLogger = new BucketLogger({
    key: context.environment.runtimeKey(),
    bucket: context.logsBucket,
  });

  const executer = new Executer(deployLogger.logfile);

  try {
    await report("deploying");

    const { paths, entryfilePath, testResults } = await new Setup({
      executer,
      context,
    }).setup();

    if (testResults) {
      await report("tests", { testResults });
    } else {
      await report("error", { message: "failed to run tests" });
      deployLogger.log("failed to run tests");
    }

    const { port, close } = await startServer({
      consolePath: paths["@wingconsole/app"],
      entryfilePath,
      logger: runtimeLogger,
      keyStore,
      requestedPort,
    });

    await report("running");

    return {
      paths,
      logfile: deployLogger.logfile,
      port,
      close: async () => {
        deployLogger.stop();
        runtimeLogger.stop();
        await close();
      },
    };
  } catch (error: any) {
    deployLogger.log(error.toString());

    console.error("preview runtime error", error);
    await report("error", { message: error.toString() });

    deployLogger.stop();
    runtimeLogger.stop();
    throw error;
  }
};
