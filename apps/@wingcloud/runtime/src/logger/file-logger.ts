import { appendFileSync, existsSync } from "node:fs";

import { type LoggerInterface } from "./logger.js";

export class FileLogger implements LoggerInterface {
  protected logfile: string;
  protected redact?: (message: string) => string;

  constructor({
    logfile,
    redact,
  }: {
    logfile: string;
    redact?: (message: string) => string;
  }) {
    this.logfile = logfile;
    this.redact = redact;

    if (!existsSync(this.logfile)) {
      appendFileSync(this.logfile, "", "utf8");
    }
  }

  log(message: string, props?: any[]) {
    const time = new Date().toISOString();
    let line = `${time} ${message}${
      props && props.length > 0 ? ":" + props.join(",") : ""
    }\n`;

    if (this.redact) {
      line = this.redact(line);
    }

    appendFileSync(this.logfile, line, "utf8");
  }

  getLogfile() {
    return this.logfile;
  }
}
