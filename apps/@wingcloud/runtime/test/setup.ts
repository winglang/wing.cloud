import { beforeEach, afterEach, beforeAll } from "vitest"
import { testing, cloud } from '@winglang/sdk';
import { join, resolve } from "path";
import { simpleGit } from 'simple-git';
import { mkdtempSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";

let sim: testing.Simulator;
let logsBucket: cloud.IBucketClient;
let wingApiUrl: string;
let examplesDir: string;

beforeAll(async () => {
  examplesDir = mkdtempSync(join(tmpdir(), "examples-"));
  cpSync(resolve(join(__dirname, "../../../../examples")), examplesDir, { recursive: true });
  const git = simpleGit(examplesDir)
  await git.init();
  await git.add(".");
  await git.commit("initial commit");
});

beforeEach(async () => {
  sim = new testing.Simulator({ simfile: resolve(join(__dirname, "../../infrastructure/target/main.wsim")) });
  await sim.start();
  logsBucket = sim.getResource("root/Default/Runtime/deployment logs") as cloud.IBucketClient;
  const wingApi = sim.getResource("root/Default/wing api") as cloud.Api;
  wingApiUrl = wingApi.url;
});

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
};

export const withTestContext = async (cb: (props: TextContextCallbackProps) => Promise<void>) => {
  const sim = new testing.Simulator({ simfile: resolve(join(__dirname, "../../infrastructure/target/main.wsim")) });
  await sim.start();
  const logsBucket = sim.getResource("root/Default/Runtime/deployment logs") as cloud.IBucketClient;
  const wingApi = sim.getResource("root/Default/wing api") as cloud.Api;
  const wingApiUrl = wingApi.url;

  await cb({ logsBucket, wingApiUrl, examplesDir });

  await sim.stop();
};
