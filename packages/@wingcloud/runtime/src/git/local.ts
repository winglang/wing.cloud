import { GitCommit, GitProvider } from "./provider";

export class LocalGitProvider extends GitProvider {
  constructor() {
    super();
  }

  cloneUrl(commit: GitCommit): string {
    return commit.repo;
  }
}
