import { test, expect, describe, afterAll, beforeAll } from 'vitest'
import { compile } from '@winglang/compiler'
import path from 'path';
import fs from 'fs';

describe('Platform', () => {
  let originalEnv;
  let tempDir;
  let templatePath;

  afterAll(() => {
    process.env = originalEnv;
    fs.rmdirSync(tempDir, { recursive: true });
  });

  describe("simple.main.w", () => {
    beforeAll(async () => {
      originalEnv = { ...process.env };
      fs.mkdirSync(path.join(__dirname, '..', 'tmp'), { recursive: true });
      tempDir = fs.mkdtempSync(path.join(__dirname, '..', 'tmp', 'platform-production-'));

      process.env = Object.assign(process.env, {
        TF_BACKEND_BUCKET: 'mock-bucket',
        TF_BACKEND_BUCKET_REGION: 'mock-region',
        TF_BACKEND_STATE_FILE: 'mock-key',
        TF_BACKEND_LOCK_TABLE: 'mock-table',
        WING_ENV: 'production',
      });

      const lib = path.join(__dirname, '..', 'lib', "index.js");
      const result = await compile('examples/simple.main.w', {
        platform: [lib],
        testing: false,
        color: false,
        targetDir: tempDir,
      });

      templatePath = path.join(result, 'main.tf.json');
    }, 10000);

    test('s3_backend', async () => {
      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      const backend = template.terraform['backend']['s3'];

      // code bucket and the cloud.Bucket
      expect(backend).toMatchObject({
        bucket: 'mock-bucket',
        region: 'mock-region',
        key: 'mock-key',
        dynamodb_table: 'mock-table',
      });
    });

    test('aws_s3_bucket', async () => {
      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      const buckets = template.resource['aws_s3_bucket'];
;
      expect(buckets['cloudBucket']).toBeDefined();
      expect(buckets['cloudBucket']).not.include({
        force_destroy: true,
      });
    });

    test('aws_dynamodb_table', async () => {
      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      const tables = template.resource['aws_dynamodb_table'];

      expect(Object.values(tables).length).toEqual(1);
      expect(tables['exDynamodbTable']).toBeDefined();
      expect(tables['exDynamodbTable']).toMatchObject({
        billing_mode: 'PAY_PER_REQUEST',
      });
    });
  });


  describe("api.main.w", () => {
    beforeAll(async () => {
      originalEnv = { ...process.env };
      fs.mkdirSync(path.join(__dirname, '..', 'tmp'), { recursive: true });
      tempDir = fs.mkdtempSync(path.join(__dirname, '..', 'tmp', 'platform-production-'));

      process.env = Object.assign(process.env, {
        TF_BACKEND_BUCKET: 'mock-bucket',
        TF_BACKEND_BUCKET_REGION: 'mock-region',
        TF_BACKEND_STATE_FILE: 'mock-key',
        TF_BACKEND_LOCK_TABLE: 'mock-table',
        WING_ENV: 'production',
      });

      const lib = path.join(__dirname, '..', 'lib', "index.js");
      const result = await compile('examples/api.main.w', {
        platform: [lib],
        testing: false,
        color: false,
        targetDir: tempDir,
      });

      templatePath = path.join(result, 'main.tf.json');
    }, 10000);

    test('enable xray for functions', async () => {
      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      const functions = template.resource['aws_lambda_function'];
      const fn = functions['cloudApi_get_hello_0_2F9F5F19'];

      expect(fn).toBeDefined();
      expect(fn).toMatchObject({
        tracing_config: {
          mode: 'Active',
        },
        layers: [
          'arn:aws:lambda:${data.aws_region.Region.name}:901920570463:layer:aws-otel-nodejs-arm64-ver-1-17-1:1',
        ],
      });

      const fnPath = fn['//']['metadata']['path']
      const basePath = fnPath.slice(0, fnPath.lastIndexOf('/'));

      const rolePolicy: any | undefined = Object.values(template.resource['aws_iam_role_policy']).find((policy: any) => {
        return policy['//']['metadata']['path'].startsWith(basePath);
      });

      expect(rolePolicy).toBeDefined();

      const policy = JSON.parse(rolePolicy['policy']);

      expect(policy).toMatchObject({
        Statement: expect.arrayContaining([
          {
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
              'xray:GetSamplingRules',
              'xray:GetSamplingTargets',
              'xray:GetSamplingStatisticSummaries',
            ],
            Effect: 'Allow',
            Resource: ['*'],
          },
        ]),
      });
    });

    test('enable xray for api gateway', async () => {
      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      const stages = template.resource['aws_api_gateway_stage'];
      const stage = stages['cloudApi_api_stage_BBB283E4'];

      expect(stage).toBeDefined();
      expect(stage).toMatchObject({
        xray_tracing_enabled: true,
      });
    });
  });
});