import { expect, test } from "vitest"
import { setupServer } from "msw/node"
import { graphql, rest } from "msw"
import fetch from 'node-fetch';
import { run } from "../src/run";
import { LocalGitProvider } from "../src/git/local";
import { getContext } from "./setup";
import { GithubProvider } from "../src/git/github";
import { Environment } from "../src/environment";
import { execFileSync } from "node:child_process";
import { sleep } from "./utils";
import { ReportEnvironmentStatusInput } from "../src/report-status";

test("run() - installs npm packages and run tests", async () => {
  process.env.FILE_BUCKET_SYNC_MS = "50";
  const { examplesDir, logsBucket, wingApiUrl } = getContext();
  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("redis/main.w", { repo: examplesDirRepo, sha: "main" });
  const { port, close } = await run({ context: { environment, gitProvider, logsBucket, wingApiUrl } });

  await sleep(200);
  
  const deploymentLogs = await logsBucket.get(environment.bucketKey("deployment"));
  expect(deploymentLogs).toContain("Running npm install\n\nadded 1 package");
  expect(deploymentLogs).toContain(`Server is listening on port ${port}`);
  
  const testLogs = await logsBucket.get(environment.bucketKey("test"));
  expect(testLogs).toContain("pass ─ main.wsim » root/env0/test:Hello, world!");

  const response = await fetch(`http://localhost:${port}/logs`)
  expect(await response.text()).toEqual(deploymentLogs);

  await close();
});

test("run() - throws when repo not found", async () => {
  const { examplesDir, logsBucket, wingApiUrl } = getContext();
  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("redis/main.w", { repo: `${examplesDirRepo}-not`, sha: "main" });
  await expect(() => run({ context: { environment, gitProvider, logsBucket, wingApiUrl } }))
    .rejects.toThrowError(/command git failed with status/);
});

test("run() - doesn't have access to runtime env vars expect PATH", async () => {
  const { examplesDir, logsBucket, wingApiUrl } = getContext();
  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("access-env/main.w", { repo: examplesDirRepo, sha: "main" });
  process.env["GITHUB_TOKEN"] = "123";
  process.env["PATH"] = process.env["PATH"] + ":/special-path";
  const { close } = await run({ context: { environment, gitProvider, logsBucket, wingApiUrl } });
  
  const testLogs = await logsBucket.get(environment.bucketKey("test"));
  expect(testLogs).toContain("pass ─ main.wsim » root/env0/test:access-token");

  await close();
});

test("run() - has deployment logs", async () => {
  const { examplesDir, logsBucket, wingApiUrl } = getContext();
  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("logs/main.w", { repo: examplesDirRepo, sha: "main" });
  const { close } = await run({ context: { environment, gitProvider, logsBucket, wingApiUrl } });
  
  const testLogs = await logsBucket.get(environment.bucketKey("test"));
  expect(testLogs).toContain("a test log");

  await close();
});

test("run() - reporting statuses", async () => {
  const { examplesDir, logsBucket, wingApiUrl } = getContext();

  const reportUrl = `${wingApiUrl}/report`;
  const restHandler = rest.post(reportUrl, (req, res, ctx) => {
    return res(ctx.status(200))
  })

  const server = setupServer(restHandler);
  server.listen({ onUnhandledRequest: "error" });

  const requests: ReportEnvironmentStatusInput[] = [];
  server.events.on('request:start', async (req) => {
    if (req.url.toString() === reportUrl) {
      const body = await req.json();
      requests.push(body);
    }
  })

  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("redis/main.w", { repo: examplesDirRepo, sha: "main" });
  const { close } = await run({ context: { environment, gitProvider, logsBucket, wingApiUrl } });

  expect(requests).toStrictEqual([{
    environmentId: "redis/main.w",
    status: "deploying"
  }, {
    environmentId: "redis/main.w",
    status: "running"
  }]);
  
  await close();
  server.close();
  server.resetHandlers();
});

test("run() - environment can override wing version", async () => {
  const { examplesDir, logsBucket, wingApiUrl } = getContext();
  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("override-wing-version/main.w", { repo: examplesDirRepo, sha: "main" });
  const { paths, close } = await run({ context: { environment, gitProvider, logsBucket, wingApiUrl } });
  
  const output = execFileSync("node", [paths.winglang , "-V"]);
  expect(output.toString().trim()).toEqual("0.29.0");

  await close();
});

test("run() - works with github", async () => {
  const { logsBucket, wingApiUrl } = getContext();
  const gitProvider = new GithubProvider("");
  const environment = new Environment("examples/redis/main.w", { repo: "eladcon/examples", sha: "main" });
  const bucket = logsBucket;
  const { close } = await run({ context: { environment, gitProvider, logsBucket, wingApiUrl } });
  
  const testLogs = await logsBucket.get(environment.bucketKey("test"));
  expect(testLogs).toContain("pass ─ main.wsim » root/env0/test:Hello, world!");

  await close();
});
