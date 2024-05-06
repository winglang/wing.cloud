import { type cloud } from "@winglang/sdk";
import { BucketClient } from "@winglang/sdk/lib/shared-aws/bucket.inflight.js";
import { makeSimulatorClient } from "@winglang/sdk/lib/simulator/client.js";

import { handler } from "./index.js";

const bucketName = process.env["LOGS_BUCKET_NAME"];
if (!bucketName) {
  throw new Error("missing bucket name");
}

let logsBucket: cloud.IBucketClient | undefined;
if (process.env["WING_TARGET"] == "tf-aws") {
  logsBucket = new BucketClient(bucketName);
} else {
  const simulatorUrl = process.env["WING_SIMULATOR_URL"];
  if (!simulatorUrl) {
    throw new Error("missing simulator url");
  }
  logsBucket = makeSimulatorClient(simulatorUrl, bucketName, bucketName);
}

const wingApiUrl = process.env["WING_CLOUD_URL"];
if (!wingApiUrl) {
  throw new Error("missing wing cloud api url");
}

try {
  new URL(wingApiUrl);
  console.log("url ok");
} catch (error: any) {
  console.log("url no ok", error.toString());
}
console.log(`runtime entrypoint: ${bucketName}, ${wingApiUrl}`);

handler({ logsBucket: logsBucket!, wingApiUrl });
