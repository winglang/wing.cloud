# CloudFront Logs Bucket

This folder contains the necessary resources for creating an S3 bucket to store logs from CloudFront distributions.

## Files

### athena.tfaws.w

This file contains the class `CloudfrontLogsTable` which initializes the bucket, workgroup, database, and named query for Athena. It also sets up the Glue Catalog Table with the necessary columns for the CloudFront logs.

### bucket.tfaws.w

This file contains the class `CloudfrontLogsBucket` which initializes the S3 bucket with the necessary configurations and access controls.

## Usage

To use these resources, you need to instantiate the classes in your main file and pass the necessary parameters.

For `CloudfrontLogsTable`, you need to pass the bucket name and log prefix defined in the distrubtion. It sets up an Athena table inthe "cloudfront_logs" workgroup ready to query cloudfront logs.

For `CloudfrontLogsBucket`, you need to pass the name of the bucket. It's exposing a `dependable` attribute, which should be used as a dependency within the Cloudfront distribution, to make sure that all necessary resources of the S3 bucket, including ACLs, are fully provisioned. Otherwise, a deployment of the distribution will fail randomly.

## Testing

To test this, run "wing test -t tf-aws example.main.w" to automatically test. Similarily, it can be compiled and deployed as any other Wing app for dev purposes.



