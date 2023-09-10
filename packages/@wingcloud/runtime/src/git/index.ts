import { GithubProvider } from "./github";
import { LocalGitProvider } from "./local";

export const getGitProvider = (repo: string, gitToken: string) => {
  return repo.startsWith("file://") ? new LocalGitProvider() : new GithubProvider(gitToken);
};