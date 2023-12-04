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
      });

      const lib = path.join(__dirname, '..', 'lib', "platform-production.js");
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

      // code bucket and the cloud.Bucket
      expect(Object.values(buckets).length).toEqual(1);
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

    test('aws_lambda_function', async () => {
      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      const functions = template.resource['aws_lambda_function'];

      console.log({functions})

      expect(Object.values(functions).length).toEqual(1);
      expect(functions['cloudBucket_oncreate-OnMessage0_0B1CA993']).toBeDefined();
      expect(functions['cloudBucket_oncreate-OnMessage0_0B1CA993']).toMatchObject({
        tracing_config: {
          mode: 'Active',
        }
      });
    });
  });
});