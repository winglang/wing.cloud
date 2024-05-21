import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";

import type { FileLogger } from "./logger/file-logger.js";

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
  constructor(logger: FileLogger) {
    this.logger = logger;
  }

  async exec(command: string, args: string[], options?: ExecProps) {
    if (!options?.dontAppendPrefix) {
      this.logger.log(`Running ${command} ${args.join(" ")}`);
    }
    // eslint-disable-next-line unicorn/no-null
    let statusCode: number | null = null;
    let stdout = "";
    let stderr = "";
    const onData = (data: any) => {
      const output = data.toString();
      if (options?.logfile) {
        appendFileSync(options?.logfile, output, "utf8");
      } else {
        this.logger.log(output);
        console.log(output);
      }
    };
    await new Promise<void>((resolve) => {
      const subprocess = spawn(command, args, {
        cwd: options?.cwd,
        env: options?.env
          ? { ...options.env, PATH: process.env["PATH"] }
          : process.env,
      });
      subprocess.stdout.on("data", (data) => {
        stdout += data.toString();
        onData(data);
      });
      subprocess.stderr.on("data", (data) => {
        stderr += data.toString();
        onData(data);
      });
      subprocess.on("close", (code) => {
        statusCode = code;
        resolve();
      });
    });
    if (!options?.dontAppendSuffix) {
      this.logger.log(`Command ${command} exited with status ${statusCode}`);
    }
    if ((options?.throwOnFailure && statusCode !== 0) || statusCode === null) {
      throw new Error(`command ${command} failed with status ${statusCode}`);
    }
    return { statusCode, stdout, stderr };
  }
}
