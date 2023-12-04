import { type AppProps, App } from '@winglang/sdk/lib/core';
import type { IPlatform } from '@winglang/sdk/lib/platform';
import { App as PlatformApp } from './app';
import s3Backend from './s3-backend';
import awsS3Bucket from './test/aws_s3_bucket';
import awsDynamodbTable from './test/aws_dynamodb_table';

export class Platform implements IPlatform {
  public readonly target = 'tf-aws';

  newApp(appProps: AppProps): App {
    console.error("hello from test");
    return new PlatformApp(appProps);
  }

  postSynth(config: any) {
    config = s3Backend(config);
    config = awsS3Bucket(config);
    config = awsDynamodbTable(config);
    return config;
  }
}