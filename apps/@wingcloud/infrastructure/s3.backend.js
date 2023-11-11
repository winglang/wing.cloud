/**
 *    - TF_BACKEND_BUCKET - The name of the s3 bucket to use for storing Terraform state
 *    - TF_BACKEND_BUCKET_REGION - The region the bucket was deployed to
 *    - TF_BACKEND_STATE_FILE - The object key used to store state file
 */

const { Aspects } = require("cdktf");

class OverrideApiGatewayDeployment {
  constructor() {}

  visit(node) {
    if (node.terraformResourceType === "aws_api_gateway_deployment") {
      // override create_before_destroy since it's causing issues with
      // cyclic dependencies see https://github.com/hashicorp/terraform-provider-aws/issues/11344#issuecomment-1521831630
      // should be removed once deployed
      node.lifecycle = {
        create_before_destroy: true,
        ignore_changes: ["triggers"]
      };
    }
  }
}


exports.Platform = class BackendS3 {
  preSynth(app) {
    Aspects.of(app).add(new OverrideApiGatewayDeployment());
  }

  postSynth(config) {
    if (!process.env.TF_BACKEND_BUCKET) {throw new Error("env var TF_BACKEND_BUCKET not set")}
    if (!process.env.TF_BACKEND_BUCKET_REGION) {throw new Error("env var TF_BACKEND_BUCKET_REGION not set")}
    if (!process.env.TF_BACKEND_STATE_FILE) {throw new Error("env var TF_BACKEND_STATE_FILE not set")}
    if (!process.env.TF_BACKEND_LOCK_TABLE) {throw new Error("env var TF_BACKEND_LOCK_TABLE not set")}
    config.terraform.backend = {
      s3: {
        bucket: process.env.TF_BACKEND_BUCKET,
        region: process.env.TF_BACKEND_BUCKET_REGION,
        key: process.env.TF_BACKEND_STATE_FILE,
        dynamodb_table: process.env.TF_BACKEND_LOCK_TABLE,
      }
    }
    return config;
  }
}
