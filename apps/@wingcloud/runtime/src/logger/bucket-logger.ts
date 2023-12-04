import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { IBucketClient } from "@winglang/sdk/lib/cloud/bucket.js";

import { fileBucketSync } from "../storage/file-bucket-sync.js";

import { FileLogger } from "./file-logger.js";

export class BucketLogger extends FileLogger {
  stop: () => void;

  constructor({
    key,
    bucket,
    redact,
  }: {
    key: string;
    bucket: IBucketClient;
    redact?: (message: string) => string;
  }) {
    const logfile = join(tmpdir(), "log-" + randomBytes(8).toString("hex"));
    super({ logfile, redact: redact });

    try {
      const { cancelSync } = fileBucketSync({
        file: logfile,
        key,
        bucket,
      });
      this.stop = cancelSync;
    } catch (error) {
      console.log(error);
      this.stop = () => {};
    }
  }
}
