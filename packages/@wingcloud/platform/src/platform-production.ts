import { type AppProps, App } from '@winglang/sdk/lib/core';
import type { IPlatform } from '@winglang/sdk/lib/platform';
import { App as PlatformApp } from './app';
import s3Backend from './s3-backend';

export class Platform implements IPlatform {
  public readonly target = 'tf-aws';

  newApp(appProps: AppProps): App {
    console.error("hello from production");
    return new PlatformApp(appProps);
  }

  postSynth(config: any) {
    config = s3Backend(config);
    return config;
  }
}