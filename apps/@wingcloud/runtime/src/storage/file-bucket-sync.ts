import { readFileSync } from "node:fs";

import { cloud } from "@winglang/sdk";
import chokidar from "chokidar";

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

  const watcher = chokidar.watch(file);
  watcher.on("change", sync);
  sync();

  return {
    cancelSync: async () => {
      await watcher.close();
      return sync();
    },
  };
}
