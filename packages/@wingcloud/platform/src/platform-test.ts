import { type AppProps, App } from '@winglang/sdk/lib/core';
import type { IPlatform } from '@winglang/sdk/lib/platform';
import { App as TestApp } from './test/app';
import s3Backend from './s3-backend';
import awsS3Bucket from './test/aws_s3_bucket';

export class Platform implements IPlatform {
  public readonly target = 'tf-aws';

  newApp(appProps: AppProps): App {
    console.error("hello from test");
    return new TestApp(appProps);
  }

  postSynth(config: any) {
    config = s3Backend(config);
    config = awsS3Bucket(config);
    return config;
  }
}