import { type AppProps, App } from '@winglang/sdk/lib/core';
import { Node as WingNode } from '@winglang/sdk/lib/std';
import type { IPlatform } from '@winglang/sdk/lib/platform';
import { aws } from '@winglang/sdk';
import { App as PlatformApp } from './app';
import s3Backend from './s3-backend';
import { Aspects } from 'cdktf';
import { Construct } from 'constructs';

class OverrideApiGatewayDeployment {
  constructor() {}

  visit(node: Construct) {
    if (node instanceof aws.Function) {
      console.log({node})
    }
  }
}

export class Platform implements IPlatform {
  public readonly target = 'tf-aws';

  newApp(appProps: AppProps): App {
    console.error("hello from production");
    return new PlatformApp(appProps);
  }

  preSynth(app: App) {
    Aspects.of(app).add(new OverrideApiGatewayDeployment());
    return app;
  }

  postSynth(config: any) {
    config = s3Backend(config);
    return config;
  }
}