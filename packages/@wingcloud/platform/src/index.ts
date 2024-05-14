import { API_FQN } from "@winglang/sdk/lib/cloud";
import { type AppProps, App } from "@winglang/sdk/lib/core";
import type { IPlatform } from "@winglang/sdk/lib/platform";
import { Aspects } from "cdktf";
import type { Construct } from "constructs";

import { CustomApi } from "./api.js";
import { App as CustomApp } from "./app.js";
import { ProductionPlatform } from "./platform-production.js";
import { TestPlatform } from "./platform-test.js";
import { OverrideApiGatewayDeployment } from "./production/cyclic_hack.js";
import { EnableXray } from "./production/enable_xray.js";

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

export class Platform implements IPlatform {
  public readonly target = "tf-aws";

  public readonly parameters = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: {
      type: "object",
      properties: {
        concurrency: {
          type: "string",
        },
        mergeLambdas: {
          type: "string",
        },
        warmLambdas: {
          type: "string",
        },
      },
      required: [],
    },
  };

  newApp(appProps: AppProps): App {
    return new CustomApp(appProps);
  }

  public newInstance(
    type: string,
    scope: Construct,
    id: string,
    props: any,
  ): any {
    if (
      type === API_FQN &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      App.of(scope).parameters.value(id)?.mergeLambdas === "true"
    ) {
      return new CustomApi(scope, id, props);
    }
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
    Aspects.of(app).add(new OverrideApiGatewayDeployment());

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
