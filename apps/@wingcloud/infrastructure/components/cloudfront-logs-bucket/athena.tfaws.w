bring cloud;
bring util;
bring "@cdktf/provider-aws" as aws;

pub class CloudfrontLogsTable {
  new(bucketName: str, prefix: str) {

    let isTestEnvironment = util.tryEnv("WING_IS_TEST") != nil;

    let queryResultBucket = new aws.s3Bucket.S3Bucket(
      bucketPrefix: "athena-query-results",
      forceDestroy: isTestEnvironment,
    );

    let workGroup = new aws.athenaWorkgroup.AthenaWorkgroup(
      name: "cloudfront_logs",
      configuration: {
        publishCloudwatchMetricsEnabled: true,
        resultConfiguration: {
          outputLocation: "s3://${queryResultBucket.bucket}/"
        }
      }
    );

    let db = new aws.athenaDatabase.AthenaDatabase(
      name: "cloudfront_logs",
      bucket: queryResultBucket.bucket,            
      forceDestroy: isTestEnvironment,      
    );

    new aws.athenaNamedQuery.AthenaNamedQuery(
      database: db.name,
      workgroup: workGroup.name,
      name: "recent-logs",
      description: "Get recent logs",
      query: "select * from cloudfront_logs limit 10;"
    );

    new aws.glueCatalogTable.GlueCatalogTable(
      name: "cloudfront_logs",
      databaseName: db.name,
      parameters: {
        EXTERNAL: "true",
        "skip.header.line.count": "2"
      },
      storageDescriptor: {
        location: "s3://${bucketName}/${prefix}/",
        inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
        outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
        serDeInfo: {
          name: "serde",
          serializationLibrary: "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe",
  
          parameters: {
            "field.delim": "\t",
            "serialization.format": "\t"
          }
        },
        columns: [
          {
            name: "date",
            type: "date"
          },
          {
            name: "time",
            type: "string",
          },
          {
            name: "location",
            type: "string",
          },
          {
            name: "bytes",
            type: "bigint",
          },
          {
            name: "request_ip",
            type: "string",
          },
          {
            name: "method",
            type: "string",
          },
          {
            name: "host",
            type: "string",
          },
          {
            name: "uri",
            type: "string",
          },
          {
            name: "status",
            type: "int",
          },
          {
            name: "referrer",
            type: "string",
          },
          {
            name: "user_agent",
            type: "string",
          },
          {
            name: "query_string",
            type: "string",
          },
          {
            name: "cookie",
            type: "string",
          },
          {
            name: "result_type",
            type: "string",
          },
          {
            name: "request_id",
            type: "string",
          },
          {
            name: "host_header",
            type: "string",
          },
          {
            name: "request_protocol",
            type: "string",
          },
          {
            name: "request_bytes",
            type: "bigint",
          },
          {
            name: "time_taken",
            type: "float",
          },
          {
            name: "xforwarded_for",
            type: "string",
          },
          {
            name: "ssl_protocol",
            type: "string",
          },
          {
            name: "ssl_cipher",
            type: "string",
          },
          {
            name: "response_result_type",
            type: "string",
          },
          {
            name: "http_version",
            type: "string",
          },
          {
            name: "fle_status",
            type: "string",
          },
          {
            name: "fle_encrypted_fields",
            type: "int",
          },
          {
            name: "c_port",
            type: "int",
          },
          {
            name: "time_to_first_byte",
            type: "float",
          },
          {
            name: "x_edge_detailed_result_type",
            type: "string",
          },
          {
            name: "sc_content_type",
            type: "string",
          },
          {
            name: "sc_content_len",
            type: "bigint",
          },
          {
            name: "sc_range_start",
            type: "bigint",
          },
          {
            name: "sc_range_end",
            type: "bigint",
          }
        ]              
      }
    );    
  }
}