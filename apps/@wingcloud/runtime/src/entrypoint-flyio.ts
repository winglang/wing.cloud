import { BucketClient } from "@winglang/sdk/lib/shared-aws/bucket.inflight";
import { handler } from ".";

const bucketName = process.env["LOGS_BUCKET_NAME"];
if (!bucketName) {
  throw Error("missing bucket name");
}
const logsBucket = new BucketClient(bucketName);

const wingApiUrl = process.env["WING_CLOUD_URL"];
if (!wingApiUrl) {
  throw Error("missing wing cloud api url");
}

handler({ logsBucket, wingApiUrl });
