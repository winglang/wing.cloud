import { type GitCommit, GitProvider } from "./provider.js";

export class LocalGitProvider extends GitProvider {
  constructor() {
    super();
  }

  cloneUrl(commit: GitCommit): string {
    return commit.repo;
  }
}
