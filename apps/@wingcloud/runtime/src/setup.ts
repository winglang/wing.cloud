import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path, { dirname, join } from "node:path";

import { type EnvironmentContext } from "./environment.js";
import { Executer } from "./executer.js";
import { BucketLogger } from "./logger/bucket-logger.js";
import { useBucketWrite } from "./storage/bucket-write.js";
import { installWing } from "./wing/install.js";
import { runWingTests } from "./wing/test.js";
import { glob } from "glob";

export interface SetupProps {
  executer: Executer;
  context: EnvironmentContext;
  logger: BucketLogger;
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
  logger: BucketLogger;

  constructor({ executer, context, logger }: SetupProps) {
    this.executer = executer;
    this.context = context;
    this.logger = logger;
    this.sourceDir = mkdtempSync(join(tmpdir(), "source-"));
  }

  async run() {
    const entrypointPath = join(
      this.sourceDir,
      this.context.environment.entrypoint,
    );
    const entrydir = dirname(entrypointPath);
    await this.gitClone();
    await this.npmInstall(this.sourceDir);
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
      logger: this.logger,
      bucketWrite: useBucketWrite({ bucket: this.context.logsBucket }),
    });
  }

  private async gitClone() {
    this.logger.log("Cloning repo", [
      this.context.environment.commit.repo,
      this.context.environment.commit.sha,
    ]);
    return this.context.gitProvider.clone(
      this.executer,
      this.context.environment.commit,
      this.sourceDir,
    );
  }

  private async npmInstall(cwd: string) {
    return glob("**/package.json", {
      cwd,
      absolute: true,
      ignore: ["**/node_modules/**"],
    }).then((files) => {
      this.logger.log("Installing npm dependencies");
      const installPromises = files.map((packageJsonFile) => {
        this.logger.log(`- path: ${packageJsonFile}`);
        if (packageJsonFile) {
          const installArgs = ["install"];
          if (this.context.cacheDir) {
            installArgs.push("--cache", this.context.cacheDir);
          }
          return this.executer.exec("npm", installArgs, {
            cwd: path.dirname(packageJsonFile),
            throwOnFailure: true,
          });
        }
        return Promise.resolve();
      });
      return Promise.all(installPromises);
    });
  }

  private async runCustomScript(cwd: string) {
    const scriptPath = join(cwd, "wing.sh");
    if (existsSync(scriptPath)) {
      this.logger.log("Running custom install script", [scriptPath]);
      return this.executer.exec("sh", [scriptPath], {
        cwd,
        throwOnFailure: true,
      });
    }
  }

  private async runInstallWing(cwd: string) {
    this.logger.log("Installing Winglang");
    return installWing(cwd, this.executer);
  }
}
