import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { IBucketClient } from "@winglang/sdk/lib/cloud/bucket.js";

import { Logger } from "./logger.js";
import { fileBucketSync } from "./storage/file-bucket-sync.js";

export class BucketLogger extends Logger {
  cancelFileSync: () => void;
  logfile: string;

  constructor({ key, bucket }: { key: string; bucket: IBucketClient }) {
    super();

    this.logfile = join(tmpdir(), "log-" + randomBytes(8).toString("hex"));
    try {
      const { cancelSync } = fileBucketSync({
        file: this.logfile,
        key,
        bucket,
      });
      this.cancelFileSync = cancelSync;
    } catch (error) {
      console.log(error);
      this.cancelFileSync = () => {};
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
