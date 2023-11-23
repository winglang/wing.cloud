import { spawnSync } from "node:child_process";
import { openSync, createReadStream } from "node:fs";

import type { FileLogger } from "./file-logger.js";

export interface ExecProps {
  cwd?: string;
  throwOnFailure?: boolean;
  env?: Record<string, string>;
  logfile?: string;
  dontAppendPrefix?: boolean;
  dontAppendSuffix?: boolean;
}

export class Executer {
  logger: FileLogger;
  logfile: string;
  outfile: number;
  errfile: number;
  constructor(logger: FileLogger) {
    this.logger = logger;
    const logfile = logger.logfile;

    createReadStream(logfile).pipe(process.stdout);
    this.logfile = logfile;
    this.errfile = openSync(logfile, "a");
    this.outfile = openSync(logfile, "a");
  }

  async exec(command: string, args: string[], options?: ExecProps) {
    let logfile = this.logfile;
    let errfile = this.errfile;
    let outfile = this.outfile;
    if (options?.logfile) {
      logfile = options.logfile;
      errfile = openSync(logfile, "a");
      outfile = openSync(logfile, "a");
    }

    if (!options?.dontAppendPrefix) {
      this.logger.log(`Running ${command} ${args.join(" ")}`);
    }
    const subprocess = spawnSync(command, args, {
      cwd: options?.cwd,
      stdio: ["ignore", outfile, errfile],
      env: options?.env
        ? { ...options.env, PATH: process.env["PATH"] }
        : process.env,
    });
    if (!options?.dontAppendSuffix) {
      this.logger.log(
        `Command ${command} exited with status ${subprocess.status}`,
      );
    }
    if (
      (options?.throwOnFailure && subprocess.status !== 0) ||
      subprocess.status === null
    ) {
      throw new Error(
        `command ${command} failed with status ${subprocess.status}`,
      );
    }
    return subprocess.status;
  }
}
