import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { type EnvironmentContext } from "./environment.js";
import { Executer } from "./executer.js";
import { useBucketWrite } from "./storage/bucket-write.js";
import { installWing } from "./wing/install.js";
import { wingTest } from "./wing/test.js";

export interface SetupProps {
  e: Executer;
  context: EnvironmentContext;
}

export interface WingPaths {
  winglang: string;
  "@wingconsole/app": string;
  "@winglang/compiler": string;
  "@winglang/sdk": string;
}

export class Setup {
  e: Executer;
  context: EnvironmentContext;
  sourceDir: string;

  constructor({ e, context }: SetupProps) {
    this.e = e;
    this.context = context;
    this.sourceDir = mkdtempSync(join(tmpdir(), "source-"));
  }

  async setup() {
    const entryfilePath = join(
      this.sourceDir,
      this.context.environment.entryfile,
    );
    const entrydir = dirname(entryfilePath);
    await this.gitClone();
    await this.npmInstall(entrydir);
    const wingPaths = await this.runInstallWing(entrydir);
    const testResults = await this.runWingTest(wingPaths, entryfilePath);

    return { paths: wingPaths, entryfilePath, testResults };
  }

  private async gitClone() {
    return this.context.gitProvider.clone(
      this.e,
      this.context.environment.commit,
      this.sourceDir,
    );
  }

  private async npmInstall(cwd: string) {
    if (existsSync(join(cwd, "package.json"))) {
      return this.e.exec("npm", ["install"], { cwd, throwOnFailure: true });
    }
  }

  private async runInstallWing(cwd: string) {
    return installWing(cwd, this.e);
  }

  private async runWingTest(wingPaths: WingPaths, entryfile: string) {
    return wingTest({
      wingCompilerPath: wingPaths["@winglang/compiler"],
      wingSdkPath: wingPaths["@winglang/sdk"],
      entryfilePath: entryfile,
      environment: this.context.environment,
      bucketWrite: useBucketWrite({ bucket: this.context.logsBucket }),
    });
  }
}
