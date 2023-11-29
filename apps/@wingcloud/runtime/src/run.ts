import { createKeyStore } from "./auth/key-store.js";
import { BucketLogger } from "./bucket-logger.js";
import { cleanEnvironment } from "./clean.js";
import { type EnvironmentContext } from "./environment.js";
import { Executer } from "./executer.js";
import { useReportStatus } from "./report-status.js";
import { Setup } from "./setup.js";
import { prepareServer } from "./wing/server.js";

export interface RunProps {
  context: EnvironmentContext;
  requestedPort?: number;
  requestedSSLPort?: number;
}

export const run = async function ({
  context,
  requestedPort,
  requestedSSLPort,
}: RunProps) {
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

  const executer = new Executer(deployLogger);
  const setup = new Setup({
    executer,
    context,
  });

  let wingPaths;
  const { startServer, closeSSL } = await prepareServer({
    environmentId: context.environment.id,
    requestedSSLPort,
  });
  try {
    await report("deploying");

    const { paths, entryfilePath } = await setup.run();
    wingPaths = paths;

    // clean environment from secrets and environment variables
    cleanEnvironment();

    const testResults = await setup.runWingTest(paths, entryfilePath);

    if (testResults) {
      await report("tests", { testResults });
    } else {
      await report("error", { message: "failed to run tests" });
      deployLogger.log("failed to run tests");
    }

    const { port, close, endpoints } = await startServer({
      consolePath: paths["@wingconsole/app"],
      entryfilePath,
      logger: runtimeLogger,
      keyStore,
      requestedPort,
    });

    await report("running", { objects: { endpoints } });

    return {
      paths,
      logfile: deployLogger.getLogfile(),
      port,
      endpoints,
      close: async () => {
        deployLogger.stop();
        runtimeLogger.stop();
        await close();
        closeSSL();
      },
    };
  } catch (error: any) {
    if (wingPaths) {
      const wingCompiler = await import(wingPaths["@winglang/compiler"]);
      if (error instanceof wingCompiler.CompileError) {
        // TODO: Use @wingconsole/server/src/utils/format-wing-error.ts to format the error
        let errorMessage = error.diagnostics
          .map((diagnostic: any) => diagnostic.message)
          .join("\n");

        runtimeLogger.log(`Error: ${errorMessage}`);
      } else {
        deployLogger.log(error.message);
      }
    } else {
      deployLogger.log(error.message);
    }
    await report("error", { message: error.message });

    deployLogger.stop();
    runtimeLogger.stop();
    closeSSL();
    throw error;
  }
};
