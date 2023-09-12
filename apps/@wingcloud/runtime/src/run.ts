import { join } from "node:path";
import { tmpdir } from "node:os";
import { Executer } from "./executer";
import { startServer } from "./wing/server";
import { Setup } from "./setup";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { EnvironmentContext } from "./environment";
import { fileBucketSync } from "./storage/file-bucket-sync";
import { createKeyStore } from "./auth/key-store";
import { useReportStatus } from "./report-status";

export interface RunProps {
  context: EnvironmentContext;
  requestedPort?: number;
};

export const run = async function ({ context, requestedPort }: RunProps) {
  const logfile = join(tmpdir(), "log-" + randomBytes(8).toString("hex"));
  console.log(`Setup preview runtime. logfile ${logfile}`);

  const keyStore = await createKeyStore(context.environment.entryfile);
  const report = useReportStatus(context, keyStore);

  try {
    await report("deploying");

    const e = new Executer(logfile);
    const { cancelSync } = fileBucketSync({ file: logfile, key: context.environment.deploymentKey(), bucket: context.logsBucket });

    const { paths, entryfilePath, testResults } = await new Setup({ e, context }).setup();
    await report("tests", { testResults });

    const { port, close } = await startServer({ consolePath: paths["@wingconsole/app"], entryfilePath, logfile, keyStore, requestedPort });

    await report("running");

    return { paths, logfile, port, close: async () => {
      cancelSync();
      await close();
    } };
  } catch (err) {
    console.error("preview runtime error", err, readFileSync(logfile, "utf-8"));
    await report("error");
    throw err;
  }
};
