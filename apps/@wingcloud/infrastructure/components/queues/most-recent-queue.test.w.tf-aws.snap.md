# `most-recent-queue.test.w.tf-aws.snap.md`

## main.tf.json

```json
{
  "//": {
    "metadata": {
      "backend": "local",
      "stackName": "root",
      "version": "0.20.3"
    },
    "outputs": {
    }
  },
  "provider": {
    "aws": [
      {
      }
    ]
  },
  "resource": {
    "aws_cloudwatch_log_group": {
      "MostRecentQueue_FifoQueue_tf-aws_Function_CloudwatchLogGroup_E83689D4": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/FifoQueue/tf-aws/Function/CloudwatchLogGroup",
            "uniqueId": "MostRecentQueue_FifoQueue_tf-aws_Function_CloudwatchLogGroup_E83689D4"
          }
        },
        "name": "/aws/lambda/Function-c89c034c",
        "retention_in_days": 30
      },
      "MostRecentQueue_Table_Field_Handler_CloudwatchLogGroup_EA51DA81": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/Table/Field/Handler/CloudwatchLogGroup",
            "uniqueId": "MostRecentQueue_Table_Field_Handler_CloudwatchLogGroup_EA51DA81"
          }
        },
        "name": "/aws/lambda/Handler-c8f430c0",
        "retention_in_days": 30
      }
    },
    "aws_dynamodb_table": {
      "Counter": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/Counter/Default",
            "uniqueId": "Counter"
          }
        },
        "attribute": [
          {
            "name": "id",
            "type": "S"
          }
        ],
        "billing_mode": "PAY_PER_REQUEST",
        "hash_key": "id",
        "name": "wing-counter-Counter-c824ef62"
      },
      "MostRecentQueue_Table_Table_tfaws_DynamodbTable_6A491F31": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/Table/Table_tfaws/DynamodbTable",
            "uniqueId": "MostRecentQueue_Table_Table_tfaws_DynamodbTable_6A491F31"
          }
        },
        "attribute": [
          {
            "name": "groupId",
            "type": "S"
          }
        ],
        "billing_mode": "PAY_PER_REQUEST",
        "hash_key": "groupId",
        "name": "MostRecentQueue-Table-Table_tfaws-bcefe85e",
        "stream_enabled": true,
        "stream_view_type": "NEW_AND_OLD_IMAGES"
      }
    },
    "aws_iam_role": {
      "MostRecentQueue_FifoQueue_tf-aws_Function_IamRole_984F6C1F": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/FifoQueue/tf-aws/Function/IamRole",
            "uniqueId": "MostRecentQueue_FifoQueue_tf-aws_Function_IamRole_984F6C1F"
          }
        },
        "assume_role_policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Action\":\"sts:AssumeRole\",\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},\"Effect\":\"Allow\"}]}"
      },
      "MostRecentQueue_Table_Field_Handler_IamRole_1B207813": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/Table/Field/Handler/IamRole",
            "uniqueId": "MostRecentQueue_Table_Field_Handler_IamRole_1B207813"
          }
        },
        "assume_role_policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Action\":\"sts:AssumeRole\",\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},\"Effect\":\"Allow\"}]}"
      }
    },
    "aws_iam_role_policy": {
      "MostRecentQueue_FifoQueue_tf-aws_Function_IamRolePolicy_AD47C07D": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/FifoQueue/tf-aws/Function/IamRolePolicy",
            "uniqueId": "MostRecentQueue_FifoQueue_tf-aws_Function_IamRolePolicy_AD47C07D"
          }
        },
        "policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Action\":[\"sqs:ReceiveMessage\",\"sqs:ChangeMessageVisibility\",\"sqs:GetQueueUrl\",\"sqs:DeleteMessage\",\"sqs:GetQueueAttributes\"],\"Resource\":[\"${aws_sqs_queue.MostRecentQueue_FifoQueue_tf-aws_SqsQueue_48584B41.arn}\"],\"Effect\":\"Allow\"},{\"Action\":[\"dynamodb:GetItem\"],\"Resource\":[\"${aws_dynamodb_table.MostRecentQueue_Table_Table_tfaws_DynamodbTable_6A491F31.arn}\"],\"Effect\":\"Allow\"},{\"Action\":[\"s3:PutObject*\",\"s3:Abort*\"],\"Resource\":[\"${aws_s3_bucket.Bucket.arn}\",\"${aws_s3_bucket.Bucket.arn}/*\"],\"Effect\":\"Allow\"},{\"Action\":[\"dynamodb:UpdateItem\"],\"Resource\":[\"${aws_dynamodb_table.Counter.arn}\"],\"Effect\":\"Allow\"}]}",
        "role": "${aws_iam_role.MostRecentQueue_FifoQueue_tf-aws_Function_IamRole_984F6C1F.name}"
      },
      "MostRecentQueue_Table_Field_Handler_IamRolePolicy_959C544B": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/Table/Field/Handler/IamRolePolicy",
            "uniqueId": "MostRecentQueue_Table_Field_Handler_IamRolePolicy_959C544B"
          }
        },
        "policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":\"none:null\",\"Resource\":\"*\"}]}",
        "role": "${aws_iam_role.MostRecentQueue_Table_Field_Handler_IamRole_1B207813.name}"
      }
    },
    "aws_iam_role_policy_attachment": {
      "MostRecentQueue_FifoQueue_tf-aws_Function_IamRolePolicyAttachment_E48867FA": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/FifoQueue/tf-aws/Function/IamRolePolicyAttachment",
            "uniqueId": "MostRecentQueue_FifoQueue_tf-aws_Function_IamRolePolicyAttachment_E48867FA"
          }
        },
        "policy_arn": "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        "role": "${aws_iam_role.MostRecentQueue_FifoQueue_tf-aws_Function_IamRole_984F6C1F.name}"
      },
      "MostRecentQueue_Table_Field_Handler_IamRolePolicyAttachment_C44804B2": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/Table/Field/Handler/IamRolePolicyAttachment",
            "uniqueId": "MostRecentQueue_Table_Field_Handler_IamRolePolicyAttachment_C44804B2"
          }
        },
        "policy_arn": "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        "role": "${aws_iam_role.MostRecentQueue_Table_Field_Handler_IamRole_1B207813.name}"
      }
    },
    "aws_lambda_event_source_mapping": {
      "MostRecentQueue_FifoQueue_tf-aws_LambdaEventSourceMapping_10834E60": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/FifoQueue/tf-aws/LambdaEventSourceMapping",
            "uniqueId": "MostRecentQueue_FifoQueue_tf-aws_LambdaEventSourceMapping_10834E60"
          }
        },
        "batch_size": 1,
        "event_source_arn": "${aws_sqs_queue.MostRecentQueue_FifoQueue_tf-aws_SqsQueue_48584B41.arn}",
        "function_name": "${aws_lambda_function.MostRecentQueue_FifoQueue_tf-aws_Function_4B49BA9F.function_name}"
      }
    },
    "aws_lambda_function": {
      "MostRecentQueue_FifoQueue_tf-aws_Function_4B49BA9F": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/FifoQueue/tf-aws/Function/Default",
            "uniqueId": "MostRecentQueue_FifoQueue_tf-aws_Function_4B49BA9F"
          }
        },
        "architectures": [
          "arm64"
        ],
        "environment": {
          "variables": {
            "BUCKET_NAME_1357ca3a": "${aws_s3_bucket.Bucket.bucket}",
            "DYNAMODB_TABLE_NAME_6cb5a3a4": "${aws_dynamodb_table.Counter.name}",
            "NODE_OPTIONS": "--enable-source-maps",
            "WING_FUNCTION_NAME": "Function-c89c034c",
            "WING_TARGET": "tf-aws",
            "WING_TOKEN_TFTOKEN_TOKEN_0": "${jsonencode(aws_dynamodb_table.MostRecentQueue_Table_Table_tfaws_DynamodbTable_6A491F31.name)}"
          }
        },
        "function_name": "Function-c89c034c",
        "handler": "index.handler",
        "memory_size": 1024,
        "publish": true,
        "role": "${aws_iam_role.MostRecentQueue_FifoQueue_tf-aws_Function_IamRole_984F6C1F.arn}",
        "runtime": "nodejs20.x",
        "s3_bucket": "${aws_s3_bucket.Code.bucket}",
        "s3_key": "${aws_s3_object.MostRecentQueue_FifoQueue_tf-aws_Function_S3Object_105F2C7B.key}",
        "timeout": 60,
        "vpc_config": {
          "security_group_ids": [
          ],
          "subnet_ids": [
          ]
        }
      },
      "MostRecentQueue_Table_Field_Handler_37A5B422": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/Table/Field/Handler/Default",
            "uniqueId": "MostRecentQueue_Table_Field_Handler_37A5B422"
          }
        },
        "architectures": [
          "arm64"
        ],
        "environment": {
          "variables": {
            "NODE_OPTIONS": "--enable-source-maps",
            "WING_FUNCTION_NAME": "Handler-c8f430c0",
            "WING_TARGET": "tf-aws",
            "WING_TOKEN_TFTOKEN_TOKEN_0": "${jsonencode(aws_dynamodb_table.MostRecentQueue_Table_Table_tfaws_DynamodbTable_6A491F31.name)}"
          }
        },
        "function_name": "Handler-c8f430c0",
        "handler": "index.handler",
        "memory_size": 1024,
        "publish": true,
        "role": "${aws_iam_role.MostRecentQueue_Table_Field_Handler_IamRole_1B207813.arn}",
        "runtime": "nodejs20.x",
        "s3_bucket": "${aws_s3_bucket.Code.bucket}",
        "s3_key": "${aws_s3_object.MostRecentQueue_Table_Field_Handler_S3Object_743B20E1.key}",
        "timeout": 60,
        "vpc_config": {
          "security_group_ids": [
          ],
          "subnet_ids": [
          ]
        }
      }
    },
    "aws_s3_bucket": {
      "Bucket": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/Bucket/Default",
            "uniqueId": "Bucket"
          }
        },
        "bucket_prefix": "bucket-c88fdc5f-",
        "force_destroy": false
      },
      "Code": {
        "//": {
          "metadata": {
            "path": "root/Default/Code",
            "uniqueId": "Code"
          }
        },
        "bucket_prefix": "code-c84a50b1-"
      }
    },
    "aws_s3_object": {
      "MostRecentQueue_FifoQueue_tf-aws_Function_S3Object_105F2C7B": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/FifoQueue/tf-aws/Function/S3Object",
            "uniqueId": "MostRecentQueue_FifoQueue_tf-aws_Function_S3Object_105F2C7B"
          }
        },
        "bucket": "${aws_s3_bucket.Code.bucket}",
        "key": "asset.c89c034c00b101615a4b7e3927af0e9fcfa1de941a.9ed99881caa946bd3cc141bf0858ca2e.zip",
        "source": "assets/MostRecentQueue_FifoQueue_tf-aws_Function_Asset_F5E36AD1/E093F8A7D9646EB8E4302D3CC706F2F0/archive.zip"
      },
      "MostRecentQueue_Table_Field_Handler_S3Object_743B20E1": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/Table/Field/Handler/S3Object",
            "uniqueId": "MostRecentQueue_Table_Field_Handler_S3Object_743B20E1"
          }
        },
        "bucket": "${aws_s3_bucket.Code.bucket}",
        "key": "asset.c8f430c08423507445b144602f84de8035e3df7585.3f41d74ef22479f1fede638657b775b7.zip",
        "source": "assets/MostRecentQueue_Table_Field_Handler_Asset_258342E0/39EE36D26C71C2E2B385BA46A5C78B1B/archive.zip"
      }
    },
    "aws_sqs_queue": {
      "MostRecentQueue_FifoQueue_tf-aws_SqsQueue_48584B41": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MostRecentQueue/FifoQueue/tf-aws/SqsQueue",
            "uniqueId": "MostRecentQueue_FifoQueue_tf-aws_SqsQueue_48584B41"
          }
        },
        "content_based_deduplication": true,
        "fifo_queue": true,
        "message_retention_seconds": 3600,
        "visibility_timeout_seconds": 120
      }
    }
  },
  "terraform": {
    "backend": {
      "local": {
        "path": "./terraform.tfstate"
      }
    },
    "required_providers": {
      "aws": {
        "source": "aws",
        "version": "5.31.0"
      }
    }
  }
}
```
