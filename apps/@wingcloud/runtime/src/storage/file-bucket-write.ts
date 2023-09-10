import { cloud } from '@winglang/sdk';
import { readFileSync } from 'fs';

export interface FileBucketWriteProps {
  file: string;
  key: string;
  bucket: cloud.IBucketClient;
};

export async function fileBucketWrite({ file, key, bucket }: FileBucketWriteProps) {
  const contents = readFileSync(file, "utf-8");
  await bucket.put(key, contents);
};
