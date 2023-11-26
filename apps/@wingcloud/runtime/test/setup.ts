import { mkdtempSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { simulator, cloud } from "@winglang/sdk";
import { type ApiSchema } from "@winglang/sdk/lib/target-sim/schema-resources.js";
import { simpleGit } from "simple-git";
import { beforeEach, afterEach, beforeAll } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));

let sim: simulator.Simulator;
let logsBucket: cloud.IBucketClient;
let wingApiUrl: string;
let examplesDir: string;

beforeAll(async () => {
  examplesDir = mkdtempSync(join(tmpdir(), "examples-"));
  cpSync(resolve(join(currentDir, "../../../../examples")), examplesDir, {
    recursive: true,
  });
  const git = simpleGit(examplesDir);
  await git.init();
  await git.add(".");
  await git.commit("initial commit");
});

beforeEach(async () => {
  sim = new simulator.Simulator({
    simfile: resolve(join(currentDir, "../../infrastructure/target/main.wsim")),
  });
  await sim.start();
  logsBucket = sim.getResource(
    "root/Default/runtime.RuntimeService/deployment logs",
  ) as cloud.IBucketClient;
  const config = sim.getResourceConfig("root/Default/cloud.Api") as ApiSchema;
  wingApiUrl = config.attrs.url;
}, 60_000);

afterEach(async () => {
  await sim?.stop();
});

export const getContext = () => {
  return {
    logsBucket,
    wingApiUrl,
    examplesDir,
  };
};

export interface TextContextCallbackProps {
  logsBucket: cloud.IBucketClient;
  wingApiUrl: string;
  examplesDir: string;
}

export const withTestContext = async (
  cb: (props: TextContextCallbackProps) => Promise<void>,
) => {
  const sim = new simulator.Simulator({
    simfile: resolve(join(currentDir, "../../infrastructure/target/main.wsim")),
  });
  await sim.start();
  const logsBucket = sim.getResource(
    "root/Default/runtime.RuntimeService/deployment logs",
  ) as cloud.IBucketClient;
  const config = sim.getResourceConfig("root/Default/cloud.Api") as ApiSchema;
  const wingApiUrl = config.attrs.url;

  await cb({ logsBucket, wingApiUrl, examplesDir });

  await sim.stop();
};
