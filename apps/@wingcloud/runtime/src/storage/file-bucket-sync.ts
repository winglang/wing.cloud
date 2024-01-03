import { readFileSync, watch } from "node:fs";

import { cloud } from "@winglang/sdk";

export interface FileBucketSyncProps {
  file: string;
  key: string;
  bucket: cloud.IBucketClient;
}

export function fileBucketSync({ file, key, bucket }: FileBucketSyncProps) {
  const sync = async () => {
    try {
      const contents = readFileSync(file, "utf8");
      await bucket.put(key, contents);
    } catch (error) {
      console.error("failed to sync logs", error);
    }
  };

  const watcher = watch(file, sync);
  sync();

  return {
    cancelSync: async () => {
      watcher.close();
      return sync();
    },
  };
}
