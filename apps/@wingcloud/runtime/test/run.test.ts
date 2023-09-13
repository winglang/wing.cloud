import { execFileSync } from "node:child_process";

import jwt from "jsonwebtoken";
import { rest } from "msw";
import { setupServer } from "msw/node";
import fetch from "node-fetch";
import { expect, test } from "vitest";

import { Environment } from "../src/environment.js";
import { GithubProvider } from "../src/git/github.js";
import { LocalGitProvider } from "../src/git/local.js";
import { ReportEnvironmentStatusInput } from "../src/report-status.js";
import { run } from "../src/run.js";

import { getContext } from "./setup.js";
import { sleep } from "./utils.js";

test("run() - installs npm packages and run tests", async () => {
  process.env.FILE_BUCKET_SYNC_MS = "50";
  const { examplesDir, logsBucket, wingApiUrl } = getContext();
  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("redis/main.w", {
    repo: examplesDirRepo,
    sha: "main",
  });
  const { port, close } = await run({
    context: { environment, gitProvider, logsBucket, wingApiUrl },
  });

  await sleep(200);

  const files = await logsBucket.list();
  expect(files.length).toBe(2);

  const deploymentLogs = await logsBucket.get(environment.deploymentKey());
  expect(deploymentLogs).toContain("Running npm install\n\nadded 1 package");
  expect(deploymentLogs).toContain(`Server is listening on port ${port}`);

  const testLogs = await logsBucket.get(
    environment.testKey(true, "root/Default/test:Hello, world!"),
  );
  expect(testLogs).toContain("a test log");

  const response = await fetch(`http://localhost:${port}/logs`);
  expect(await response.text()).toEqual(deploymentLogs);

  await close();
});

test("run() - throws when repo not found", async () => {
  const { examplesDir, logsBucket, wingApiUrl } = getContext();
  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("redis/main.w", {
    repo: `${examplesDirRepo}-not`,
    sha: "main",
  });
  await expect(() =>
    run({ context: { environment, gitProvider, logsBucket, wingApiUrl } }),
  ).rejects.toThrowError(/command git failed with status/);
});

test("run() - doesn't have access to runtime env vars", async () => {
  const { examplesDir, logsBucket, wingApiUrl } = getContext();
  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("access-env/main.w", {
    repo: examplesDirRepo,
    sha: "main",
  });
  process.env["GITHUB_TOKEN"] = "123";

  const { close } = await run({
    context: { environment, gitProvider, logsBucket, wingApiUrl },
  });

  expect(
    await logsBucket.exists(
      environment.testKey(true, "root/Default/test:access-token"),
    ),
  ).toBeTruthy();

  await close();
});

test("run() - reporting statuses", async () => {
  const { examplesDir, logsBucket, wingApiUrl } = getContext();

  const reportUrl = `${wingApiUrl}/report`;
  const restHandler = rest.post(reportUrl, (req, res, ctx) => {
    return res(ctx.status(200));
  });

  const server = setupServer(restHandler);
  server.listen({ onUnhandledRequest: "error" });

  const requests: ReportEnvironmentStatusInput[] = [];
  let authToken: string | undefined;
  server.events.on("request:start", async (req) => {
    if (req.url.toString() === reportUrl) {
      const body = await req.json();
      requests.push(body);

      const auth = req.headers.get("Authorization");
      if (!authToken && auth) {
        authToken = auth;
      }
    }
  });

  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("redis/main.w", {
    repo: examplesDirRepo,
    sha: "main",
  });
  const { port, close } = await run({
    context: { environment, gitProvider, logsBucket, wingApiUrl },
  });

  expect(requests).toStrictEqual([
    {
      environmentId: "redis/main.w",
      status: "deploying",
    },
    {
      environmentId: "redis/main.w",
      status: "tests",
      data: {
        testResults: [
          {
            pass: true,
            path: "root/Default/test:Hello, world!",
          },
        ],
      },
    },
    {
      environmentId: "redis/main.w",
      status: "running",
    },
  ]);

  server.close();
  server.resetHandlers();

  const response = await fetch(`http://localhost:${port}/public-key`);
  const { aud, iss, environmentId, status } = jwt.verify(
    authToken!.replace("Bearer ", ""),
    await response.text(),
  ) as any;
  expect({ aud, iss, environmentId, status }).toStrictEqual({
    environmentId: "redis/main.w",
    status: "deploying",
    aud: "https://wing.cloud",
    iss: "redis/main.w",
  });

  await close();
});

test("run() - environment can override wing version", async () => {
  const { examplesDir, logsBucket, wingApiUrl } = getContext();
  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("override-wing-version/main.w", {
    repo: examplesDirRepo,
    sha: "main",
  });
  const { paths, close } = await run({
    context: { environment, gitProvider, logsBucket, wingApiUrl },
  });

  const output = execFileSync("node", [paths.winglang, "-V"]);
  expect(output.toString().trim()).toEqual("0.29.0");

  await close();
});

test("run() - works with github", async () => {
  const { logsBucket, wingApiUrl } = getContext();
  const gitProvider = new GithubProvider("");
  const environment = new Environment("examples/redis/main.w", {
    repo: "eladcon/examples",
    sha: "main",
  });
  const bucket = logsBucket;
  const { close } = await run({
    context: { environment, gitProvider, logsBucket, wingApiUrl },
  });

  expect(
    await logsBucket.exists(
      environment.testKey(true, "root/Default/test:Hello, world!"),
    ),
  ).toBeTruthy();

  await close();
});

test("run() - have multiple tests results", async () => {
  const { examplesDir, logsBucket, wingApiUrl } = getContext();
  const examplesDirRepo = `file://${examplesDir}`;
  const gitProvider = new LocalGitProvider();
  const environment = new Environment("multiple-tests/main.w", {
    repo: examplesDirRepo,
    sha: "main",
  });
  const { close } = await run({
    context: { environment, gitProvider, logsBucket, wingApiUrl },
  });

  const files = await logsBucket.list();
  expect(files.length).toBe(4);

  expect(
    await logsBucket.get(
      environment.testKey(true, "root/Default/test:will succeed"),
    ),
  ).toContain("will succeed first log\nwill succeed second log");
  expect(
    await logsBucket.exists(
      environment.testKey(true, "root/Default/test:will succeed 2"),
    ),
  ).toBeTruthy();
  expect(
    await logsBucket.get(
      environment.testKey(false, "root/Default/test:will fail"),
    ),
  ).toContain("will fail log");

  await close();
});
