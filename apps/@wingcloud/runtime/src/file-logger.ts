import { appendFileSync, existsSync } from "node:fs";

import { type LoggerInterface } from "./logger.js";

export class FileLogger implements LoggerInterface {
  logfile: string;

  constructor({ logfile }: { logfile: string }) {
    this.logfile = logfile;

    if (!existsSync(this.logfile)) {
      appendFileSync(this.logfile, "", "utf8");
    }
  }

  log = (message: string, props?: any[]) => {
    const time = new Date().toISOString();

    appendFileSync(
      this.logfile,
      `${time} ${message}${
        props && props.length > 0 ? ":" + props.join(",") : ""
      }\n`,
      "utf8",
    );
  };
}
