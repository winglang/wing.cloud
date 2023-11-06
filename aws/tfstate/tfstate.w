bring cloud;
bring util;
bring "cdktf" as cdktf;
bring "@cdktf/provider-aws" as aws;

pub class TerraformState {
  init(environment: str) {
    let dynamoDbTable = new aws.dynamodbTable.DynamodbTable(
      name: "wingcloud-tfstate-lock-${environment}",
      billingMode: "PAY_PER_REQUEST",
      hashKey: "LockID",
      attribute: {
          name: "LockID",
          type: "S"
      },      
    );

    let s3Bucket = new aws.s3Bucket.S3Bucket(
        bucket: "wingcloud-tfstate-${environment}",        
        lifecycle: {
          preventDestroy: true
        }
    );

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
        bucket: s3Bucket.id
    );

    new aws.s3BucketVersioning.S3BucketVersioningA(
        bucket: s3Bucket.id,
        versioningConfiguration: {
          status: "Enabled"
        }
    );  

    new cdktf.TerraformOutput(
        value: dynamoDbTable.id
    ) as "lock-table-name";

    new cdktf.TerraformOutput(
        value: s3Bucket.bucket
    ) as "state-bucket-name";
  }
}