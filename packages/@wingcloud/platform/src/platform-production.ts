import { type AppProps, App } from '@winglang/sdk/lib/core';
import type { IPlatform } from '@winglang/sdk/lib/platform';
import { App as TestApp } from './test/app';

export class Platform implements IPlatform {
  public readonly target = 'tf-aws';

  newApp(appProps: AppProps): App {
    console.error("hello from production");
    return new TestApp(appProps);
  }

  postSynth(config: any) {
    return config;
  }
}