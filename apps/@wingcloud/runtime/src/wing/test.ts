import { compile as compileFn, BuiltinPlatform } from "@winglang/compiler";
import { type simulator, type std } from "@winglang/sdk";

import { Environment } from "../environment.js";

export interface WingTestProps {
  wingCompilerPath: string;
  wingSdkPath: string;
  entrypointPath: string;
  environment: Environment;
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
  });
  return simfile;
}

async function wingTestOne(
  testRunner: std.ITestRunnerClient,
  testResourcePath: string,
  props: WingTestProps,
) {
  const timestamp = new Date().toISOString();

  const startTime = Date.now();
  const result = await testRunner.runTest(testResourcePath);
  const time = Date.now() - startTime;

  const id = testResourcePath.replaceAll(/[^\dA-Za-z]/g, "");
  const testResult = {
    ...result,
    id,
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

  await props.bucketWrite(
    props.environment.testKey(result.pass, testResourcePath),
    JSON.stringify(testResult),
  );
  return { id, path: result.path, pass: result.pass };
}

export async function wingTest(props: WingTestProps) {
  const simfile = await wingCompile(
    props.wingCompilerPath,
    props.entrypointPath,
  );

  try {
    const wingSdk = await import(props.wingSdkPath);
    const simulator: simulator.Simulator =
      await new wingSdk.simulator.Simulator({
        simfile,
      });
    await simulator.start();

    const client = simulator.getResource(
      "root/cloud.TestRunner",
    ) as std.ITestRunnerClient;
    const testResults = [];
    for (let test of await client.listTests()) {
      const testResult = await wingTestOne(client, test, props);
      testResults.push(testResult);
    }

    await simulator.stop();

    return testResults;
  } catch (error) {
    console.error("failed to run wing tests", error);
  }
}
