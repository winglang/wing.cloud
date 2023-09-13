import { type GitCommit, GitProvider } from "./provider.js";

export class GithubProvider extends GitProvider {
  constructor(private token: string) {
    super();
  }

  cloneUrl(commit: GitCommit): string {
    return `https://oauth2:${this.token}@github.com/${commit.repo}`;
  }
}
