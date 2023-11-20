import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { simulator, cloud } from "@winglang/sdk";
import { type ApiSchema } from "@winglang/sdk/lib/target-sim/schema-resources.js";

import { handler } from "./index.js";

const start = async () => {
  const sim = new simulator.Simulator({
    simfile: resolve(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../infrastructure/target/main.wsim",
      ),
    ),
  });
  await sim.start();
  const logsBucket = sim.getResource(
    "root/Default/runtime.RuntimeService/deployment logs",
  ) as cloud.IBucketClient;
  const config = sim.getResourceConfig("root/Default/cloud.Api") as ApiSchema;
  await handler({ logsBucket, wingApiUrl: config.attrs.url });
};

start();
