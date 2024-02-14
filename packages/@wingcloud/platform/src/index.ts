import { type AppProps, App } from "@winglang/sdk/lib/core";
import type { IPlatform } from "@winglang/sdk/lib/platform";
import { Aspects } from "cdktf";

import { App as CustomApp } from "./app.js";
import { ProductionPlatform } from "./platform-production.js";
import { TestPlatform } from "./platform-test.js";

const WING_ENV = process.env["WING_ENV"] || "production";

enum WingEnv {
  Production = "production",
  Test = "test",
}

if (WING_ENV !== WingEnv.Production && WING_ENV !== WingEnv.Test) {
  throw new Error(
    `WING_ENV must be either ${WingEnv.Production} or ${WingEnv.Test}`,
  );
}

// this is a bit of a hack, but it works
// using a constructor / this on Platform leads to all
// sorts of weirdness when `postSynth` is called
// so we just use a simple if statement here
// and instantiate the correct class per hook
// https://github.com/winglang/wing/issues/5131
const PlatformHandler =
  WING_ENV === WingEnv.Production ? ProductionPlatform : TestPlatform;

import { EnableXray } from "./production/enable_xray.js";
import { EnableConcurrentExecutions } from "./production/reserved-concurreny.js";

export class Platform implements IPlatform {
  public readonly target = "tf-aws";

  newApp(appProps: AppProps): App {
    return new CustomApp(appProps);
  }

  preSynth(app: any): void {
    if (WING_ENV === WingEnv.Test) {
      return;
    }
    // this has to be in the direct entrypoint
    // of the platform, otherwise it won't work
    // see https://github.com/winglang/wing/issues/5151
    // once fixed, this can be moved to the ./pla
    Aspects.of(app).add(new EnableXray(app));

    // We used provisioned concurrency to test the response time,
    // which was consistent between 200ms and 450ms after enabling
    // this feature. We won't use it for now since it costs money.
    // Aspects.of(app).add(new EnableConcurrentExecutions(app));
  }

  postSynth(config: any) {
    const platform = new PlatformHandler();
    return platform.postSynth(config);
  }
}
