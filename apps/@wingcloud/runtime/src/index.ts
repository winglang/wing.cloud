import { cloud } from "@winglang/sdk";

import { Environment } from "./environment.js";
import { getGitProvider } from "./git/index.js";
import { run } from "./run.js";

export interface HandlerProps {
  logsBucket: cloud.IBucketClient;
  wingApiUrl: string;
}

export async function handler({ logsBucket, wingApiUrl }: HandlerProps) {
  const gitToken = process.env["GIT_TOKEN"] || "";
  const repo = process.env["GIT_REPO"] || "eladcon/examples";
  const sha = process.env["GIT_SHA"] || "main";
  const entrypoint = process.env["ENTRYPOINT"] || "examples/redis/main.w";
  const environmentId = process.env["ENVIRONMENT_ID"] || "test_environment_id";

  const gitProvider = getGitProvider(repo, gitToken);
  const environment = new Environment(environmentId, entrypoint, { repo, sha });

  await run({
    context: { environment, gitProvider, logsBucket, wingApiUrl },
    requestedPort: 3000,
    requestedSSLPort: 3001,
  });
}
