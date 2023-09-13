import * as crypto from "node:crypto";

import { cloud } from "@winglang/sdk";

import { type GitCommit, GitProvider } from "./git/provider.js";

export class Environment {
  constructor(
    public entryfile: string,
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

  private bucketKey(key: string) {
    return `${this.commit.repo}/${this.commit.sha}/${this.entryfile}/${key}.log`;
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
}
