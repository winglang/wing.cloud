import { cloud } from "@winglang/sdk";
import { GitCommit, GitProvider } from "./git/provider";

export type BucketKey = "deployment" | "test";

export class Environment {
  constructor(public entryfile: string, public commit: GitCommit) {

  }

  bucketKey(key: BucketKey) {
    return `/${this.commit.repo}/${this.commit.sha}/${this.entryfile}/${key}.log`
  }
}

export interface EnvironmentContext {
  environment: Environment;
  gitProvider: GitProvider;
  logsBucket: cloud.IBucketClient;
  wingApiUrl: string;
};