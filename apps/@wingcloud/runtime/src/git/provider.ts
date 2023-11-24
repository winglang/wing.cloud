import { Executer } from "../executer.js";

export abstract class GitProvider {
  constructor() {}

  public async clone(executer: Executer, commit: GitCommit, targetDir: string) {
    await executer.exec("git", ["clone", this.cloneUrl(commit), targetDir], {
      throwOnFailure: true,
    });
    await executer.exec("git", ["reset", "--hard", commit.sha], {
      throwOnFailure: true,
      cwd: targetDir,
    });
  }

  abstract cloneUrl(commit: GitCommit): string;
}

export interface GitCommit {
  repo: string;
  sha: string;
}
