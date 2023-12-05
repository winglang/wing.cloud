import { type ICustomPlatform } from './platform';
import s3Backend from './s3-backend';

export class ProductionPlatform implements ICustomPlatform {
  postSynth(config: any) {
    config = s3Backend(config);
    return config;
  }
}