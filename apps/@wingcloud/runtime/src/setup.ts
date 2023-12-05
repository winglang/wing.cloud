import { appendFileSync, existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { type EnvironmentContext } from "./environment.js";
import { Executer } from "./executer.js";
import { useBucketWrite } from "./storage/bucket-write.js";
import { installWing } from "./wing/install.js";
import { runWingTests } from "./wing/test.js";

export interface SetupProps {
  executer: Executer;
  context: EnvironmentContext;
}

export interface WingPaths {
  winglang: string;
  "@wingconsole/app": string;
  "@winglang/compiler": string;
  "@winglang/sdk": string;
}

export class Setup {
  executer: Executer;
  context: EnvironmentContext;
  sourceDir: string;

  constructor({ executer, context }: SetupProps) {
    this.executer = executer;
    this.context = context;
    this.sourceDir = mkdtempSync(join(tmpdir(), "source-"));
  }

  async run() {
    const entrypointPath = join(
      this.sourceDir,
      this.context.environment.entrypoint,
    );
    const entrydir = dirname(entrypointPath);
    await this.gitClone();
    await this.npmInstall(entrydir);
    await this.runCustomScript(entrydir);
    const wingPaths = await this.runInstallWing(entrydir);

    return { paths: wingPaths, entrypointPath };
  }

  async runWingTests(wingPaths: WingPaths, entrypoint: string) {
    return runWingTests({
      wingCompilerPath: wingPaths["@winglang/compiler"],
      wingSdkPath: wingPaths["@winglang/sdk"],
      entrypointPath: entrypoint,
      environment: this.context.environment,
      bucketWrite: useBucketWrite({ bucket: this.context.logsBucket }),
    });
  }

  private async gitClone() {
    return this.context.gitProvider.clone(
      this.executer,
      this.context.environment.commit,
      this.sourceDir,
    );
  }

  private async npmInstall(cwd: string) {
    if (existsSync(join(cwd, "package.json"))) {
      return this.executer.exec("npm", ["install"], {
        cwd,
        throwOnFailure: true,
      });
    }
  }

  private async runCustomScript(cwd: string) {
    const scriptPath = join(cwd, "wing.sh");
    if (existsSync(scriptPath)) {
      return this.executer.exec("sh", [scriptPath], {
        cwd,
        throwOnFailure: true,
      });
    }
  }

  private async runInstallWing(cwd: string) {
    return installWing(cwd, this.executer);
  }
}
