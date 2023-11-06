/**
 *    - ENVIRONMENT - The name of the environment 
 */

exports.Platform = class BackendS3 {
  postSynth(config) {
    if (!process.env.ENVIRONMENT) throw new Error("env var ENVIRONMENT not set");

    config.terraform.backend = {
      s3: {
        bucket: `wingcloud-tfstate-${process.env.ENVIRONMENT}`,
        region: 'us-east-1',
        key: `wingcloud/github-oidc/terraform.tfstate`,
        dynamodb_table: `wingcloud-tfstate-lock-${process.env.ENVIRONMENT}`,
      }
    }

    return config;
  }
}