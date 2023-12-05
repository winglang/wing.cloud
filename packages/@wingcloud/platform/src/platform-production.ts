import { App as PlatformApp } from './app';
import { App } from '@winglang/sdk/lib/target-tf-aws';
import { type AppProps } from '@winglang/sdk/lib/core';
import type { IPlatform } from '@winglang/sdk/lib/platform';
import s3Backend from './s3-backend';
import { Aspects } from 'cdktf';
import { EnableXray } from './production/enable_xray';

export class Platform implements IPlatform {
  public readonly target = 'tf-aws';

  newApp(appProps: AppProps): App {
    console.error("using production platform");
    return new App(appProps);
  }

  preSynth(app: PlatformApp) {
    Aspects.of(app).add(new EnableXray(app));
  }

  postSynth(config: any) {
    config = s3Backend(config);
    return config;
  }
}