import { BucketClient } from "@winglang/sdk/lib/shared-aws/bucket.inflight";

import { handler } from "./index.js";

const bucketName = process.env["LOGS_BUCKET_NAME"];
if (!bucketName) {
  throw new Error("missing bucket name");
}
const logsBucket = new BucketClient(bucketName);

const wingApiUrl = process.env["WING_CLOUD_URL"];
if (!wingApiUrl) {
  throw new Error("missing wing cloud api url");
}

handler({ logsBucket, wingApiUrl });
