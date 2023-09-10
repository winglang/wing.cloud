import { existsSync, mkdtempSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { Executer } from "./executer";
import { randomBytes } from "node:crypto";
import { fileBucketWrite } from "./storage/file-bucket-write";
import { EnvironmentContext } from "./environment";

export interface SetupProps {
  e: Executer;
  context: EnvironmentContext;
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
    const entryfilePath = join(this.sourceDir, this.context.environment.entryfile);
    const entrydir = dirname(entryfilePath);
    await this.gitClone();
    await this.npmInstall(entrydir);
    const wingCli = await this.installWing(entrydir);
    await this.wingTest(wingCli.winglang, entryfilePath)

    return { paths: wingCli, entryfilePath };
  }
  
  private async gitClone() {
    return this.context.gitProvider.clone(this.e, this.context.environment.commit, this.sourceDir)
  }
  
  private async npmInstall(cwd: string) {
    if (existsSync(join(cwd, "package.json"))) {
      return this.e.exec("npm", ["install"], { cwd, throwOnFailure: true });
    }
  }
  
  private async installWing(cwd: string) {
    const getLocalWing = (cwd: string) => {
      try {
        const wingPath = require.resolve("winglang", { paths: [cwd] });
        return { "winglang": wingPath, "@wingconsole/app": require.resolve("@wingconsole/app", { paths: [cwd] }) };
      } catch (err) { 
        return null; 
      }
    };
  
    let paths = getLocalWing(cwd);
    if (!paths) {
      const wingDir = mkdtempSync(join(tmpdir(), "wing-"));
      await this.e.exec("npm", ["init", "-y"], { cwd: wingDir, throwOnFailure: true });
      await this.e.exec("npm", ["install", "winglang"], { cwd: wingDir, throwOnFailure: true });
      paths = getLocalWing(wingDir);
      if (!paths) {
        throw new Error("failed to install winglang");
      }
    }
    
    return paths;
  }
  
  private async wingTest(wingPath: string, entryfile: string) {
    const logfile = join(tmpdir(), "test-log-" + randomBytes(8).toString("hex"));
    await this.e.exec("node", [wingPath, "test", entryfile], { cwd: dirname(entryfile), env: {}, logfile });
    await fileBucketWrite({ file: logfile, key: this.context.environment.bucketKey("test"), bucket: this.context.logsBucket });
  }
}
