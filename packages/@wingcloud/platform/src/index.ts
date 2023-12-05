import { type AppProps, App } from '@winglang/sdk/lib/core';
import type { IPlatform } from '@winglang/sdk/lib/platform';
import * as tfaws from '@winglang/sdk/lib/target-tf-aws';
import { TestPlatform } from './platform-test';
import { ProductionPlatform } from './platform-production';
import { App as CustomApp } from './app';

const WING_ENV = process.env["WING_ENV"] || "production";

enum WingEnv {
  Production = "production",
  Test = "test",
}

if (WING_ENV !== WingEnv.Production && WING_ENV !== WingEnv.Test) {
  throw new Error(`WING_ENV must be either ${WingEnv.Production} or ${WingEnv.Test}`);
}

// this is a bit of a hack, but it works
// using a constructor / this on Platform leads to all
// sorts of weirdness when `postSynth` is called
// so we just use a simple if statement here
// and instantiate the correct class per hook
// https://github.com/winglang/wing/issues/5131
const PlatformHandler = WING_ENV === WingEnv.Production ? ProductionPlatform : TestPlatform;

export class Platform implements IPlatform {
  public readonly target = 'tf-aws';

  newApp(appProps: AppProps): App {
    return new CustomApp(appProps);
  }

  postSynth(config: any) {
    const platform = new PlatformHandler();
    return platform.postSynth(config);
  }
}