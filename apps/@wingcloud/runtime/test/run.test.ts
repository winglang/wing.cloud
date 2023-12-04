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
  const environment = new Environment("test-id", "redis/main.w", {
    repo: examplesDirRepo,
    sha: "main",
  });
  const { port, close } = await run({
    context: { environment, gitProvider, logsBucket, wingApiUrl },
  });

  await sleep(200);

  const files = await logsBucket.list();
  expect(files.length).toBe(3);

  const deploymentLogs = await logsBucket.get(environment.deploymentKey());
  expect(deploymentLogs).toContain("Running npm install");
  expect(deploymentLogs).toContain("added 1 package");

  const testLogs = await logsBucket.get(
    environment.testKey(true, "root/Default/test:Hello, world!"),
  );
  expect(testLogs).toContain("a test log");

  const response = await fetch(`http://localhost:${port}/trpc/app.details`);
  expect(response.ok).toBeTruthy();

  await close();
});

// test("run() - throws when repo not found", async () => {
//   const { examplesDir, logsBucket, wingApiUrl } = getContext();
//   const examplesDirRepo = `file://${examplesDir}`;
//   const gitProvider = new LocalGitProvider();
//   const environment = new Environment("test-id", "redis/main.w", {
//     repo: `${examplesDirRepo}-not`,
//     sha: "main",
//   });
//   await expect(() =>
//     run({ context: { environment, gitProvider, logsBucket, wingApiUrl } }),
//   ).rejects.toThrowError(/command git failed with status/);
// });

// test("run() - doesn't have access to runtime env vars", async () => {
//   const { examplesDir, logsBucket, wingApiUrl } = getContext();
//   const examplesDirRepo = `file://${examplesDir}`;
//   const gitProvider = new LocalGitProvider();
//   const environment = new Environment("test-id", "access-env/main.w", {
//     repo: examplesDirRepo,
//     sha: "main",
//   });
//   process.env["GITHUB_TOKEN"] = "123";

//   const { close } = await run({
//     context: { environment, gitProvider, logsBucket, wingApiUrl },
//   });

//   expect(
//     await logsBucket.exists(
//       environment.testKey(true, "root/Default/test:access-token"),
//     ),
//   ).toBeTruthy();

//   await close();
// });

// test("run() - redacting secrets from logs", async () => {
//   process.env.FILE_BUCKET_SYNC_MS = "50";
//   const { examplesDir, logsBucket, wingApiUrl } = getContext();
//   const examplesDirRepo = `file://${examplesDir}`;
//   const gitProvider = new LocalGitProvider();
//   const environment = new Environment("test-id", "access-env/main.w", {
//     repo: examplesDirRepo,
//     sha: "main",
//   });
//   process.env["GIT_TOKEN"] = "token-123";

//   const { close } = await run({
//     context: { environment, gitProvider, logsBucket, wingApiUrl },
//   });

//   await sleep(200);

//   const deploymentLogs = await logsBucket.get(environment.deploymentKey());
//   expect(deploymentLogs).toContain("token: ***");

//   await close();
// });

// test("run() - reporting statuses", async () => {
//   const { examplesDir, logsBucket, wingApiUrl } = getContext();

//   const stateUrl = `*/trpc/app.state`;
//   const stateHandler = rest.get(stateUrl, (req, res, ctx) => {
//     return res(
//       ctx.body(
//         JSON.stringify({
//           result: {
//             data: "success",
//           },
//         }),
//       ),
//       ctx.status(200),
//     );
//   });
//   const endpointsUrl = `*/trpc/app.explorerTree`;
//   const endpointsHandler = rest.get(endpointsUrl, (req, res, ctx) => {
//     return res(
//       ctx.body(
//         JSON.stringify({
//           result: {
//             data: {},
//           },
//         }),
//       ),
//       ctx.status(200),
//     );
//   });
//   const reportUrl = `${wingApiUrl}/environment.report`;
//   const restHandler = rest.post(reportUrl, (req, res, ctx) => {
//     return res(ctx.status(200));
//   });

//   const server = setupServer(stateHandler, endpointsHandler, restHandler);
//   server.listen({ onUnhandledRequest: "error" });

//   const requests: ReportEnvironmentStatusInput[] = [];
//   let authToken: string | undefined;
//   server.events.on("request:start", async (req) => {
//     if (req.url.toString() === reportUrl) {
//       const body = await req.json();
//       requests.push(body);

//       const auth = req.headers.get("Authorization");
//       if (!authToken && auth) {
//         authToken = auth;
//       }
//     }
//   });

//   const examplesDirRepo = `file://${examplesDir}`;
//   const gitProvider = new LocalGitProvider();
//   const environment = new Environment("test-id", "redis/main.w", {
//     repo: examplesDirRepo,
//     sha: "main",
//   });
//   const { port, close } = await run({
//     context: { environment, gitProvider, logsBucket, wingApiUrl },
//   });

//   expect(requests).toStrictEqual([
//     {
//       environmentId: "test-id",
//       status: "deploying",
//     },
//     {
//       environmentId: "test-id",
//       status: "tests",
//       data: {
//         testResults: [
//           {
//             id: "rootDefaulttestHelloworld",
//             pass: true,
//             path: "root/Default/test:Hello, world!",
//           },
//         ],
//       },
//     },
//     {
//       data: {
//         objects: {
//           endpoints: [],
//         },
//       },
//       environmentId: "test-id",
//       status: "running",
//     },
//   ]);

//   server.close();
//   server.resetHandlers();

//   const response = await fetch(`http://localhost:${port}/public-key`);
//   const { aud, iss, environmentId, status } = jwt.verify(
//     authToken!.replace("Bearer ", ""),
//     await response.text(),
//   ) as any;
//   expect({ aud, iss, environmentId, status }).toStrictEqual({
//     environmentId: "test-id",
//     status: "deploying",
//     aud: "https://wing.cloud",
//     iss: "test-id",
//   });

//   await close();
// });

// test("run() - environment can override wing version", async () => {
//   const { examplesDir, logsBucket, wingApiUrl } = getContext();
//   const examplesDirRepo = `file://${examplesDir}`;
//   const gitProvider = new LocalGitProvider();
//   const environment = new Environment(
//     "test-id",
//     "override-wing-version/main.w",
//     {
//       repo: examplesDirRepo,
//       sha: "main",
//     },
//   );
//   const { paths, close } = await run({
//     context: { environment, gitProvider, logsBucket, wingApiUrl },
//   });

//   const output = execFileSync("node", [paths.winglang, "-V"]);
//   expect(output.toString().trim()).toEqual("0.44.13");

//   await close();
// });

// test("run() - works with github", async () => {
//   const { logsBucket, wingApiUrl } = getContext();
//   const gitProvider = new GithubProvider("");
//   const environment = new Environment("test-id", "examples/redis/main.w", {
//     repo: "eladcon/examples",
//     sha: "main",
//   });
//   const bucket = logsBucket;
//   const { close } = await run({
//     context: { environment, gitProvider, logsBucket, wingApiUrl },
//   });

//   expect(
//     await logsBucket.exists(
//       environment.testKey(true, "root/Default/test:Hello, world!"),
//     ),
//   ).toBeTruthy();

//   await close();
// });

// test("run() - have multiple tests results", async () => {
//   const { examplesDir, logsBucket, wingApiUrl } = getContext();
//   const examplesDirRepo = `file://${examplesDir}`;
//   const gitProvider = new LocalGitProvider();
//   const environment = new Environment("test-id", "multiple-tests/main.w", {
//     repo: examplesDirRepo,
//     sha: "main",
//   });
//   const { close } = await run({
//     context: { environment, gitProvider, logsBucket, wingApiUrl },
//   });

//   const files = await logsBucket.list();
//   expect(files.length).toBe(5);

//   expect(
//     await logsBucket.get(
//       environment.testKey(true, "root/Default/test:will succeed"),
//     ),
//   ).toContain("will succeed first log");
//   expect(
//     await logsBucket.get(
//       environment.testKey(true, "root/Default/test:will succeed"),
//     ),
//   ).toContain("will succeed second log");
//   expect(
//     await logsBucket.exists(
//       environment.testKey(true, "root/Default/test:will succeed 2"),
//     ),
//   ).toBeTruthy();
//   expect(
//     await logsBucket.get(
//       environment.testKey(false, "root/Default/test:will fail"),
//     ),
//   ).toContain("will fail log");

//   await close();
// });

// test("run() - access endpoints through reverse proxy", async () => {
//   const { examplesDir, logsBucket, wingApiUrl } = getContext();
//   const examplesDirRepo = `file://${examplesDir}`;
//   const gitProvider = new LocalGitProvider();
//   const environment = new Environment("test-id", "api/main.w", {
//     repo: examplesDirRepo,
//     sha: "main",
//   });
//   const { close, endpoints, port } = await run({
//     context: { environment, gitProvider, logsBucket, wingApiUrl },
//   });

//   expect(endpoints.length).toBe(1);
//   expect(endpoints[0].digest).toBe("d834e1d3d496ef67");
//   expect(endpoints[0].path).toBe("root/Default/cloud.Api");

//   const response = await fetch(`http://localhost:${port}`, {
//     headers: {
//       host: `localhost:${endpoints[0].port}`,
//     },
//   });

//   expect(response.ok).toBeTruthy();
//   expect(await response.text()).toEqual("OK");

//   await close();
// });
