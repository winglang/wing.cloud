import { type AppProps, App } from '@winglang/sdk/lib/core';
import type { IPlatform } from '@winglang/sdk/lib/platform';
import { S3Backend } from './s3-backend';
import { App as TestApp } from './test-app';

export class TestPlatform implements IPlatform {
  public readonly target = 'tf-aws';

  newApp(appProps: AppProps): App {
    return new TestApp(appProps);
  }

  postSynth(config: any) {
    config = S3Backend.apply(config);
    return config;
  }
}