import { compile as compileFn, Target } from "@winglang/compiler";
import { testing, std } from "@winglang/sdk";
import { Environment } from "../environment";

export interface WingTestProps {
  wingCompilerPath: string;
  wingSdkPath: string;
  entryfilePath: string;
  environment: Environment;
  bucketWrite: (key: string, contents: string) => Promise<void>;
};

async function wingCompile(wingCompilerPath: string, entryfilePath: string) {
  const wingCompiler = require(wingCompilerPath);
  const compile: typeof compileFn = wingCompiler.compile;
  const simfile = await compile(entryfilePath, { target: Target.SIM });
  return simfile;
}

async function wingTestOne(testRunner: std.ITestRunnerClient, testResourcePath: string, props: WingTestProps) {
  const result = await testRunner.runTest(testResourcePath);
  const traces = result.traces.map(t => {
    if (t.type === "log") {
      return t.data.message as string;
    } else {
      return null;
    }
  }).filter(t => !!t).join("\n");
  const logs = result.error ? `${result.error}\n${traces}` : traces;
  await props.bucketWrite(props.environment.testKey(result.pass, testResourcePath), logs);
  return { path: result.path, pass: result.pass };
}

export async function wingTest(props: WingTestProps) {
  const simfile = await wingCompile(props.wingCompilerPath, props.entryfilePath);

  try {
    const wingSdk = require(props.wingSdkPath);
    const simulator: testing.Simulator = await new wingSdk.testing.Simulator({ simfile });
    await simulator.start();

    const client = simulator.getResource("root/cloud.TestRunner") as std.ITestRunnerClient;
    const testResults = [];
    for (let test of await client.listTests()) {
      const testResult = await wingTestOne(client, test, props);
      testResults.push(testResult);
      await simulator.reload();
    }

    await simulator.stop();

    return testResults;
  } catch (error) {
    console.error("failed to run wing tests", error);
  }
};
