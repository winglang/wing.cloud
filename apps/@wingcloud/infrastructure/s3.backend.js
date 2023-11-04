/**
 *    - TF_BACKEND_BUCKET - The name of the s3 bucket to use for storing Terraform state
 *    - TF_BACKEND_BUCKET_REGION - The region the bucket was deployed to
 *    - TF_BACKEND_STATE_FILE - The object key used to store state file 
 */

exports.postSynth = function(config) {
  if (!process.env.TF_BACKEND_BUCKET) {throw new Error("env var TF_BACKEND_BUCKET not set")}
  if (!process.env.TF_BACKEND_BUCKET_REGION) {throw new Error("env var TF_BACKEND_BUCKET_REGION not set")}
  if (!process.env.TF_BACKEND_STATE_FILE) {throw new Error("env var TF_BACKEND_STATE_FILE not set")}
  if (!process.env.TF_BACKEND_LOCK_TABLE) {throw new Error("env var TF_BACKEND_LOCK_TABLE not set")}
  config.terraform.backend = {
    s3: {
      bucket: process.env.TF_BACKEND_BUCKET,
      region: process.env.TF_BACKEND_BUCKET_REGION,
      key: process.env.TF_BACKEND_STATE_FILE,
      table_name: process.env.TF_BACKEND_LOCK_TABLE,
    }
  }
  return config;
}
