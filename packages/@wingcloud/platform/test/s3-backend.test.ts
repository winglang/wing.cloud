import s3Backend from '../src/s3-backend';
import { test, expect, describe, afterEach, beforeEach } from 'vitest'

describe('S3Backend', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should apply config with correct values', () => {
    const config = {
      terraform: {
        backend: {}
      }
    };

    process.env = Object.assign(process.env, {
      TF_BACKEND_BUCKET: 'mock-bucket',
      TF_BACKEND_BUCKET_REGION: 'mock-region',
      TF_BACKEND_STATE_FILE: 'mock-key',
      TF_BACKEND_LOCK_TABLE: 'mock-table',
    });

    const appliedConfig = s3Backend(config);

    expect(appliedConfig).toMatchSnapshot();
  });

  test('should throw error when env vars are not set', () => {
    const config = {
      terraform: {
        backend: {}
      }
    };

    process.env = Object.assign(process.env, {
      TF_BACKEND_BUCKET: '',
      TF_BACKEND_BUCKET_REGION: '',
      TF_BACKEND_STATE_FILE: '',
      TF_BACKEND_LOCK_TABLE: '',
    });

    expect(() => s3Backend(config)).toThrow();
  });
});