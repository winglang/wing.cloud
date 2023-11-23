import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { IBucketClient } from "@winglang/sdk/lib/cloud/bucket.js";

import { FileLogger } from "./file-logger.js";
import { fileBucketSync } from "./storage/file-bucket-sync.js";

export class BucketLogger extends FileLogger {
  stop: () => void;

  constructor({ key, bucket }: { key: string; bucket: IBucketClient }) {
    const logfile = join(tmpdir(), "log-" + randomBytes(8).toString("hex"));

    super({ logfile });

    try {
      const { cancelSync } = fileBucketSync({
        file: this.logfile,
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
