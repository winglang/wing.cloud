import { cloud } from "@winglang/sdk";

export interface BucketWriteProps {
  bucket: cloud.IBucketClient;
}

export function useBucketWrite({ bucket }: BucketWriteProps) {
  return async (key: string, contents: string) => {
    await bucket.put(key, contents);
  };
}
