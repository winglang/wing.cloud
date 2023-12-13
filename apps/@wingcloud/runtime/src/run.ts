import { createKeyStore } from "./auth/key-store.js";
import { cleanEnvironment } from "./clean.js";
import { type EnvironmentContext } from "./environment.js";
import { Executer } from "./executer.js";
import { BucketLogger } from "./logger/bucket-logger.js";
import { redactSecrets } from "./redact-secrets.js";
import { useReportStatus } from "./report-status.js";
import { Setup } from "./setup.js";
import { formatWingError } from "./utils/format-wing-error.js";
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
  const privateKey = process.env["PRIVATE_KEY"];

  if (!privateKey) {
    throw new Error("Missing PRIVATE_KEY environment variable");
  }

  const keyStore = await createKeyStore(context.environment.id, privateKey);
  const report = useReportStatus(context, keyStore);

  const redact = redactSecrets();

  const deployLogger = new BucketLogger({
    key: context.environment.deploymentKey(),
    bucket: context.logsBucket,
    redact,
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

    const wingPlatform = process.env["WING_TARGET"];

    // clean environment from secrets and environment variables
    cleanEnvironment();

    const { paths, entrypointPath } = await setup.run();
    wingPaths = paths;

    const testResults = await setup.runWingTests(paths, entrypointPath);

    if (testResults) {
      await report("tests", { testResults });
    } else {
      await report("error", { message: "failed to run tests" });
      deployLogger.log("failed to run tests");
    }

    const { port, close, endpoints } = await startServer({
      consolePath: paths["@wingconsole/app"],
      entrypointPath,
      logger: runtimeLogger,
      keyStore,
      requestedPort,
      platform: wingPlatform,
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
    let errorMessage = error.message;

    if (wingPaths) {
      const wingCompiler = await import(wingPaths["@winglang/compiler"]);
      if (error instanceof wingCompiler.CompileError) {
        try {
          errorMessage = await formatWingError(
            wingPaths["@winglang/compiler"],
            error,
          );
        } catch (error: any) {
          deployLogger.log(`Unable to format error: ${error.message}`);
        }
      }
    }

    deployLogger.log(errorMessage);
    await report("error", { message: errorMessage });
    await deployLogger.stop();
    await runtimeLogger.stop();
    closeSSL();
    throw error;
  }
};
