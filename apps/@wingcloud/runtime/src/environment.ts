import * as crypto from "node:crypto";

import { cloud } from "@winglang/sdk";

import { type GitCommit, GitProvider } from "./git/provider.js";

export class Environment {
  constructor(
    public id: string,
    public entrypoint: string,
    public commit: GitCommit,
  ) {}

  testKey(pass: boolean, testPath: string) {
    return this.bucketKey(
      `tests/${pass ? "passed" : "failed"}/${this.hashKey(testPath)}`,
    );
  }

  deploymentKey() {
    return this.bucketKey("deployment");
  }

  runtimeKey() {
    return this.bucketKey("runtime");
  }

  private bucketKey(key: string) {
    return `${this.id}/${key}.log`;
  }

  private hashKey(key: string): string {
    return crypto.createHash("sha512").update(key).digest("hex");
  }
}

export interface EnvironmentContext {
  environment: Environment;
  gitProvider: GitProvider;
  logsBucket: cloud.IBucketClient;
  wingApiUrl: string;
  stateDir: string;
}
