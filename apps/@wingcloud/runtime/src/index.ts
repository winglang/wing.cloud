import { cloud } from '@winglang/sdk';
import { Environment } from "./environment";
import { getGitProvider } from "./git/index";
import { run } from "./run";

export interface HandlerProps {
  logsBucket: cloud.IBucketClient;
  wingApiUrl: string;
}

export async function handler({ logsBucket, wingApiUrl }: HandlerProps) {
  const gitToken = process.env.GIT_TOKEN || "";
  const repo = process.env.GIT_REPO || "eladcon/examples";
  const sha = process.env.GIT_SHA || "main";
  const entryfile = process.env.ENTRYFILE || "examples/redis/main.w";
  
  const gitProvider = getGitProvider(repo, gitToken);
  const environment = new Environment(entryfile, { repo, sha });
  
  await run({ context: { environment, gitProvider, logsBucket, wingApiUrl }, requestedPort: 3000 });
}
