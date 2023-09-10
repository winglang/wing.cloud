import { GitCommit, GitProvider } from "./provider";

export class GithubProvider extends GitProvider {
  constructor(private token: string) {
    super();
  }

  cloneUrl(commit: GitCommit): string {
    return `https://oauth2:${this.token}@github.com/${commit.repo}`;
  }
}
