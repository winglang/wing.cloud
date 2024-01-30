import { compile as compileFn, BuiltinPlatform } from "@winglang/compiler";
import { type simulator, type std } from "@winglang/sdk";

import { Environment } from "../environment.js";
import type { BucketLogger } from "../logger/bucket-logger.js";
import { prettyPrintError } from "../utils/enhanced-error.js";

export interface WingTestProps {
  wingCompilerPath: string;
  wingSdkPath: string;
  entrypointPath: string;
  environment: Environment;
  logger: BucketLogger;
  bucketWrite: (key: string, contents: string) => Promise<void>;
}

export async function wingCompile(
  wingCompilerPath: string,
  entrypointPath: string,
) {
  const wingCompiler = await import(wingCompilerPath);
  const compile: typeof compileFn = wingCompiler.compile;
  const simfile = await compile(entrypointPath, {
    platform: [BuiltinPlatform.SIM],
    testing: true,
  });
  return simfile;
}

async function runWingTest(
  testRunner: std.ITestRunnerClient,
  testResourcePath: string,
  props: WingTestProps,
) {
  const timestamp = new Date().toISOString();

  const startTime = Date.now();
  const result = await testRunner.runTest(testResourcePath);
  const time = Date.now() - startTime;

  return {
    ...result,
    timestamp,
    time,
    traces: result.traces
      .filter((t) => t.type === "log")
      .map((t) => {
        return {
          message: t.data.message,
          timestamp: t.timestamp,
        };
      }),
  };
}

export async function runWingTests(props: WingTestProps) {
  try {
    props.logger.log("Starting wing tests app");
    const simfile = await wingCompile(
      props.wingCompilerPath,
      props.entrypointPath,
    );

    const wingSdk = await import(props.wingSdkPath);

    let simulatorLogs: { message: string; timestamp: string }[] = [];
    const simulator: simulator.Simulator =
      await new wingSdk.simulator.Simulator({
        simfile,
      });
    await simulator.start();

    simulator.onTrace({
      async callback(trace) {
        if (trace.data.status === "failure") {
          let message = await prettyPrintError(trace.data.error);
          simulatorLogs.push({
            message,
            timestamp: trace.timestamp,
          });
        }
      },
    });

    const client = simulator.getResource(
      "root/cloud.TestRunner",
    ) as std.ITestRunnerClient;

    const testResults = [];
    for (let test of await client.listTests()) {
      // reset simulator logs
      simulatorLogs = [];
      props.logger.log("Running test", [test]);
      const result = await runWingTest(client, test, props);

      const id = test.replaceAll(/[^\dA-Za-z]/g, "");
      const testResult = {
        ...result,
        id,
        traces: [...result.traces, ...simulatorLogs],
      };

      await props.bucketWrite(
        props.environment.testKey(testResult.pass, testResult.id),
        JSON.stringify(testResult),
      );

      testResults.push(testResult);
    }

    await simulator.stop();

    return { testsRun: true, testResults };
  } catch (error) {
    console.error("failed to run wing tests", error);
    return { testsRun: false, testResults: undefined, error };
  }
}
