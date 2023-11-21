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
  const executorLogfile = join(
    tmpdir(),
    "log-" + randomBytes(8).toString("hex"),
  );
  console.log(`Setup preview runtime. logfile ${executorLogfile}`);

  const keyStore = await createKeyStore(context.environment.id);
  const report = useReportStatus(context, keyStore);

  const executer = new Executer(executorLogfile);

  const logger = new BucketLogger({
    key: context.environment.buildKey(),
    bucket: context.logsBucket,
  });

  let executorLogsSync;
  try {
    await report("deploying");

    const { cancelSync } = fileBucketSync({
      file: executorLogfile,
      key: context.environment.deploymentKey(),
      bucket: context.logsBucket,
    });
    executorLogsSync = cancelSync;

    const { paths, entryfilePath, testResults } = await new Setup({
      executer,
      context,
    }).setup();

    await (testResults
      ? report("tests", { testResults })
      : report("error", { message: "failed to run tests" }));

    const { port, close } = await startServer({
      consolePath: paths["@wingconsole/app"],
      entryfilePath,
      logger,
      keyStore,
      requestedPort,
    });

    await report("running");

    return {
      paths,
      logfile: executorLogfile,
      port,
      close: async () => {
        cancelSync?.();
        logger.cancelFileSync();
        await close();
      },
    };
  } catch (error: any) {
    appendFileSync(executorLogfile, `${error.toString()}\n`, "utf8");
    console.error(
      "preview runtime error",
      error,
      readFileSync(executorLogfile, "utf8"),
    );
    await report("error", { message: error.toString() });
    logger.cancelFileSync();
    executorLogsSync?.();

    throw error;
  }
};
