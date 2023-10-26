import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { handler } from "./index.js";

const require = createRequire(import.meta.url);

const targetOptions =
  process.env["WING_TARGET"] == "tf-aws"
    ? {
        directory: "shared-aws",
        bucketClass: "BucketClient",
        arguments: [process.env["LOGS_BUCKET_NAME"]],
      }
    : {
        directory: "target-sim",
        bucketClass: "Bucket",
        arguments: [
          { topics: {} },
          {
            withTrace: async ({
              message,
              activity,
            }: {
              message: string;
              activity: () => Promise<any>;
            }) => {
              console.log(message);
              return activity();
            },
          },
        ],
      };

const BucketInflight = require(
  join(
    dirname(require.resolve("@winglang/sdk")),
    `${targetOptions.directory}/bucket.inflight`,
  ),
);
const bucketName = process.env["LOGS_BUCKET_NAME"];
if (!bucketName) {
  throw new Error("missing bucket name");
}
const logsBucket = new BucketInflight[targetOptions.bucketClass](
  ...targetOptions.arguments,
);

const wingApiUrl = process.env["WING_CLOUD_URL"];
if (!wingApiUrl) {
  throw new Error("missing wing cloud api url");
}

try {
  new URL(wingApiUrl);
  console.log("url ok");
} catch (e: any) {
  console.log("url no ok", e.toString());
}
console.log(`runtime entrypoint: ${logsBucket}, ${wingApiUrl}`);

handler({ logsBucket, wingApiUrl });
