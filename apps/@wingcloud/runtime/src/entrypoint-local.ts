import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { testing, cloud } from "@winglang/sdk";

import { handler } from "./index.js";

const start = async () => {
  const sim = new testing.Simulator({
    simfile: resolve(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../infrastructure/target/main.wsim",
      ),
    ),
  });
  await sim.start();
  const logsBucket = sim.getResource(
    "root/Default/Runtime/deployment logs",
  ) as cloud.IBucketClient;
  const wingApi = sim.getResource("root/Default/wing api") as cloud.Api; // TODO: should be cloud.IApiClient

  await handler({ logsBucket, wingApiUrl: wingApi.url });
};

start();
