import { compile as compileFn, BuiltinPlatform } from "@winglang/compiler";
import { type simulator, type std } from "@winglang/sdk";

import { Environment } from "../environment.js";

export interface WingTestProps {
  wingCompilerPath: string;
  wingSdkPath: string;
  entryfilePath: string;
  environment: Environment;
  bucketWrite: (key: string, contents: string) => Promise<void>;
}

async function wingCompile(wingCompilerPath: string, entryfilePath: string) {
  const wingCompiler = await import(wingCompilerPath);
  const compile: typeof compileFn = wingCompiler.compile;
  const simfile = await compile(entryfilePath, { platform: [BuiltinPlatform.SIM] });
  return simfile;
}

async function wingTestOne(
  testRunner: std.ITestRunnerClient,
  testResourcePath: string,
  props: WingTestProps,
) {
  const result = await testRunner.runTest(testResourcePath);
  const traces = result.traces
    .map((t) => {
      return t.type === "log" ? (t.data.message as string) : undefined;
    })
    .filter((t) => !!t)
    .join("\n");
  const logs = result.error ? `${result.error}\n${traces}` : traces;
  await props.bucketWrite(
    props.environment.testKey(result.pass, testResourcePath),
    logs,
  );
  return { path: result.path, pass: result.pass };
}

export async function wingTest(props: WingTestProps) {
  const simfile = await wingCompile(
    props.wingCompilerPath,
    props.entryfilePath,
  );

  try {
    const wingSdk = await import(props.wingSdkPath);
    const simulator: simulator.Simulator = await new wingSdk.simulator.Simulator({
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
