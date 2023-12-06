import { type ICustomPlatform } from './platform';
import s3Backend from './s3-backend';
import { Aspects } from 'cdktf';
import { EnableXray } from './production/enable_xray';

export class ProductionPlatform implements ICustomPlatform {
  preSynth(app: any) {
    Aspects.of(app).add(new EnableXray(app));
  }

  postSynth(config: any) {
    config = s3Backend(config);
    return config;
  }
}