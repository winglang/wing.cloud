import { cloud } from '@winglang/sdk';
import { readFileSync } from 'fs';

export interface FileBucketSyncProps {
  file: string;
  key: string;
  bucket: cloud.IBucketClient;
};

export function fileBucketSync({ file, key, bucket }: FileBucketSyncProps) {
  //TODO: use streaming when supported
  let clear: NodeJS.Timeout;
  const sync = async () => {
    try {
      const contents = readFileSync(file, "utf-8");
      await bucket.put(key, contents);
    } catch (err) {
      console.error("failed to sync logs, retrying...", err);
    } finally {
      clear = setTimeout(sync, parseInt(process.env.FILE_BUCKET_SYNC_MS || "5000"));
    }
  };
  sync();

  return {
    cancelSync: () => {
      clearTimeout(clear);
    }
  }
};
