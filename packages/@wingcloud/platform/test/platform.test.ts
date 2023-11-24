import { test, expect, describe, afterEach, beforeEach } from 'vitest'
import { compile } from '@winglang/compiler'
import path from 'path';
import fs from 'fs';

describe('Platform', () => {
  let originalEnv;
  let tempDir;

  beforeEach(() => {
    originalEnv = { ...process.env };
    fs.mkdirSync(path.join(__dirname, '..', 'tmp'), { recursive: true });
    tempDir = fs.mkdtempSync(path.join(__dirname, '..', 'tmp', 'platform-test-'));
    console.debug({tempDir});
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmdirSync(tempDir, { recursive: true });
  });

  test('should apply config with correct values', async () => {
    const lib = path.join(__dirname, '..', 'lib', "platform-test.js");
    const result = await compile('examples/simple.main.w', {
      platform: [lib],
      testing: true,
      color: false,
      targetDir: tempDir,
    });

    const template = JSON.parse(fs.readFileSync(path.join(result, 'main.tf.json'), 'utf8'));
    const buckets = template.resource['aws_s3_bucket'];
    // code bucket and the cloud.Bucket
    expect(Object.values(buckets).length).toEqual(2);
    expect(buckets['cloudBucket']).toBeDefined();
    expect(buckets['Code']).toBeDefined();

    expect(buckets['cloudBucket']).toMatchObject({
      force_destroy: true,
    });

    expect(buckets['Code']).toMatchObject({
      force_destroy: true,
    })
  }, { timeout: 10000});
});