export default (config: any) => {
  if (!process.env["TF_BACKEND_BUCKET"]) {throw new Error('env var TF_BACKEND_BUCKET not set');}
  if (!process.env["TF_BACKEND_BUCKET_REGION"]) {throw new Error('env var TF_BACKEND_BUCKET_REGION not set');}
  if (!process.env["TF_BACKEND_STATE_FILE"]) {throw new Error('env var TF_BACKEND_STATE_FILE not set');}
  if (!process.env["TF_BACKEND_LOCK_TABLE"]) {throw new Error('env var TF_BACKEND_LOCK_TABLE not set');}

  config.terraform.backend = {
    s3: {
      bucket: process.env["TF_BACKEND_BUCKET"],
      region: process.env["TF_BACKEND_BUCKET_REGION"],
      key: process.env["TF_BACKEND_STATE_FILE"],
      dynamodb_table: process.env["TF_BACKEND_LOCK_TABLE"],
    },
  };

  return config;
}