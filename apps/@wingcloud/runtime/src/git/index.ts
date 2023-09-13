import { GithubProvider } from "./github.js";
import { LocalGitProvider } from "./local.js";

export const getGitProvider = (repo: string, gitToken: string) => {
  return repo.startsWith("file://")
    ? new LocalGitProvider()
    : new GithubProvider(gitToken);
};
