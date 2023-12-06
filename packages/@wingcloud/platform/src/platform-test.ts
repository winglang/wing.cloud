import { type ICustomPlatform } from './platform';
import s3Backend from './s3-backend';
import awsS3Bucket from './test/aws_s3_bucket';
import awsDynamodbTable from './test/aws_dynamodb_table';

export class TestPlatform implements ICustomPlatform {
  preSynth(_app: any) {}

  postSynth(config: any) {
    config = s3Backend(config);
    config = awsS3Bucket(config);
    config = awsDynamodbTable(config);
    return config;
  }
}