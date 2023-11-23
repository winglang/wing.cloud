import { createKeyStore } from "./auth/key-store.js";
import { BucketLogger } from "./bucket-logger.js";
import { type EnvironmentContext } from "./environment.js";
import { Executer } from "./executer.js";
import { useReportStatus } from "./report-status.js";
import { Setup } from "./setup.js";
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
  const setup = new Setup({
    executer,
    context,
  });

  let wingPaths;
  try {
    await report("deploying");

    const { paths, entryfilePath } = await setup.run();
    wingPaths = paths;
    const testResults = await setup.runWingTest(paths, entryfilePath);

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
    let errorMessage = error.message;
    if (wingPaths) {
      const wingCompiler = await import(wingPaths["@winglang/compiler"]);
      if (error instanceof wingCompiler.CompileError) {
        // TODO: Use @wingconsole/server/src/utils/format-wing-error.ts to format the error
        errorMessage = error.diagnostics
          .map((diagnostic: any) => diagnostic.message)
          .join("\n");
      }
    }

    deployLogger.log(errorMessage);
    await report("error", { message: errorMessage });

    deployLogger.stop();
    runtimeLogger.stop();
    throw error;
  }
};
