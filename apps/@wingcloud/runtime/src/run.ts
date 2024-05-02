import { dirname, join } from "node:path";

import { config } from "dotenv";

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
  const privateKey = process.env["ENVIRONMENT_PRIVATE_KEY"];

  if (!privateKey) {
    throw new Error("Missing ENVIRONMENT_PRIVATE_KEY environment variable");
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
    logger: deployLogger,
  });

  let wingPaths: any;
  deployLogger.log(
    `Initializing wing server using app ${process.env["FLY_APP_NAME"] || "localhost"}`,
  );
  const { startServer, closeSSL } = await prepareServer({
    environmentId: context.environment.id,
    stateDir: context.stateDir,
    requestedSSLPort,
  });

  process.on("uncaughtException", async (err) => {
    await handleError(err);
    process.exit(1);
  });

  try {
    await report("deploying");

    const wingPlatform = process.env["WING_TARGET"];

    // clean environment from secrets and environment variables
    cleanEnvironment();

    const { paths, entrypointPath } = await setup.run();
    wingPaths = paths;

    await report("running-tests");
    const testResults = await setup.runWingTests(paths, entrypointPath);

    if (testResults.testsRun) {
      await report("running-server", { testResults: testResults.testResults });
    } else {
      const message = `failed to run tests: ${testResults.error?.toString()}`;
      await report("tests-error", { message });
      deployLogger.log(message);
    }

    deployLogger.log("Loading secrets from project .env file");
    config({ path: join(dirname(entrypointPath), ".env") });

    deployLogger.log("Loading secrets from app .env file");
    config({ path: "/app/.env", override: true });

    deployLogger.log("Starting wing console server");
    const { port, close, endpoints } = await startServer({
      consolePath: paths["@wingconsole/app"],
      entrypointPath,
      logger: runtimeLogger,
      keyStore,
      requestedPort,
      platform: wingPlatform,
    });

    const closeAll = async () => {
      deployLogger.stop();
      runtimeLogger.stop();
      await close();
      closeSSL();
    };

    process.on("SIGINT", async () => {
      await closeAll();
      process.kill(0);
    });

    await report("running", { objects: { endpoints } });

    deployLogger.log("Wing console is running");
    return {
      paths,
      logfile: deployLogger.getLogfile(),
      port,
      endpoints,
      close: closeAll,
    };
  } catch (error: any) {
    await handleError(error);
    throw error;
  }

  async function handleError(error: any) {
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
  }
};
