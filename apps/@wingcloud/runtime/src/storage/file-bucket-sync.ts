import { readFileSync } from "node:fs";

import { cloud } from "@winglang/sdk";

const fileBucketSyncMs = Number.parseInt(
  process.env["FILE_BUCKET_SYNC_MS"] || "5000",
);

export interface FileBucketSyncProps {
  file: string;
  key: string;
  bucket: cloud.IBucketClient;
}

export function fileBucketSync({ file, key, bucket }: FileBucketSyncProps) {
  let clear: NodeJS.Timeout;
  const sync = async (continueSync = true) => {
    try {
      const contents = readFileSync(file, "utf8");

      await bucket.put(key, contents);
    } catch (error) {
      console.error("failed to sync logs, retrying...", error);
    } finally {
      if (continueSync) {
        clear = setTimeout(sync, fileBucketSyncMs);
      }
    }
  };

  sync();

  return {
    cancelSync: async () => {
      return sync(false);
    },
  };
}
