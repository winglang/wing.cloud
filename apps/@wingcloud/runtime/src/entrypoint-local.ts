import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { simulator, cloud } from "@winglang/sdk";
import { type ApiSchema } from "@winglang/sdk/lib/target-sim/schema-resources.js";

import { handler } from "./index.js";

const start = async () => {
  const privateKeyFile = process.env["ENVIRONMENT_SERVER_PRIVATE_KEY_FILE"]!;
  const certificateFile = process.env["ENVIRONMENT_SERVER_CERTIFICATE_FILE"]!;
  process.env["SSL_PRIVATE_KEY"] = Buffer.from(
    readFileSync(privateKeyFile, "utf8"),
    "utf8",
  ).toString("base64");
  process.env["SSL_CERTIFICATE"] = Buffer.from(
    readFileSync(certificateFile, "utf8"),
    "utf8",
  ).toString("base64");
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
    "root/Default/deployment logs",
  ) as cloud.IBucketClient;
  const config = sim.getResourceConfig("root/Default/cloud.Api") as ApiSchema;
  await handler({ logsBucket, wingApiUrl: config.attrs.url });
};

start();
