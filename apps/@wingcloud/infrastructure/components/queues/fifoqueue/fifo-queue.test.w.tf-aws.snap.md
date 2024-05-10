# `fifo-queue.test.w.tf-aws.snap.md`

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
      "FifoQueue_tf-aws_Function_CloudwatchLogGroup_3436F212": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/FifoQueue/tf-aws/Function/CloudwatchLogGroup",
            "uniqueId": "FifoQueue_tf-aws_Function_CloudwatchLogGroup_3436F212"
          }
        },
        "name": "/aws/lambda/Function-c8d6a2d5",
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
      }
    },
    "aws_iam_role": {
      "FifoQueue_tf-aws_Function_IamRole_D58A10CF": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/FifoQueue/tf-aws/Function/IamRole",
            "uniqueId": "FifoQueue_tf-aws_Function_IamRole_D58A10CF"
          }
        },
        "assume_role_policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Action\":\"sts:AssumeRole\",\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},\"Effect\":\"Allow\"}]}"
      }
    },
    "aws_iam_role_policy": {
      "FifoQueue_tf-aws_Function_IamRolePolicy_C00CF312": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/FifoQueue/tf-aws/Function/IamRolePolicy",
            "uniqueId": "FifoQueue_tf-aws_Function_IamRolePolicy_C00CF312"
          }
        },
        "policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Action\":[\"sqs:ReceiveMessage\",\"sqs:ChangeMessageVisibility\",\"sqs:GetQueueUrl\",\"sqs:DeleteMessage\",\"sqs:GetQueueAttributes\"],\"Resource\":[\"${aws_sqs_queue.FifoQueue_tf-aws_SqsQueue_2036D4D5.arn}\"],\"Effect\":\"Allow\"},{\"Action\":[\"dynamodb:UpdateItem\"],\"Resource\":[\"${aws_dynamodb_table.Counter.arn}\"],\"Effect\":\"Allow\"}]}",
        "role": "${aws_iam_role.FifoQueue_tf-aws_Function_IamRole_D58A10CF.name}"
      }
    },
    "aws_iam_role_policy_attachment": {
      "FifoQueue_tf-aws_Function_IamRolePolicyAttachment_14CA6672": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/FifoQueue/tf-aws/Function/IamRolePolicyAttachment",
            "uniqueId": "FifoQueue_tf-aws_Function_IamRolePolicyAttachment_14CA6672"
          }
        },
        "policy_arn": "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        "role": "${aws_iam_role.FifoQueue_tf-aws_Function_IamRole_D58A10CF.name}"
      }
    },
    "aws_lambda_event_source_mapping": {
      "FifoQueue_tf-aws_LambdaEventSourceMapping_FED2E623": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/FifoQueue/tf-aws/LambdaEventSourceMapping",
            "uniqueId": "FifoQueue_tf-aws_LambdaEventSourceMapping_FED2E623"
          }
        },
        "batch_size": 1,
        "event_source_arn": "${aws_sqs_queue.FifoQueue_tf-aws_SqsQueue_2036D4D5.arn}",
        "function_name": "${aws_lambda_function.FifoQueue_tf-aws_Function_87AC50B8.function_name}"
      }
    },
    "aws_lambda_function": {
      "FifoQueue_tf-aws_Function_87AC50B8": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/FifoQueue/tf-aws/Function/Default",
            "uniqueId": "FifoQueue_tf-aws_Function_87AC50B8"
          }
        },
        "architectures": [
          "arm64"
        ],
        "environment": {
          "variables": {
            "DYNAMODB_TABLE_NAME_6cb5a3a4": "${aws_dynamodb_table.Counter.name}",
            "NODE_OPTIONS": "--enable-source-maps",
            "WING_FUNCTION_NAME": "Function-c8d6a2d5",
            "WING_TARGET": "tf-aws"
          }
        },
        "function_name": "Function-c8d6a2d5",
        "handler": "index.handler",
        "memory_size": 1024,
        "publish": true,
        "role": "${aws_iam_role.FifoQueue_tf-aws_Function_IamRole_D58A10CF.arn}",
        "runtime": "nodejs20.x",
        "s3_bucket": "${aws_s3_bucket.Code.bucket}",
        "s3_key": "${aws_s3_object.FifoQueue_tf-aws_Function_S3Object_0B2E985A.key}",
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
      "FifoQueue_tf-aws_Function_S3Object_0B2E985A": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/FifoQueue/tf-aws/Function/S3Object",
            "uniqueId": "FifoQueue_tf-aws_Function_S3Object_0B2E985A"
          }
        },
        "bucket": "${aws_s3_bucket.Code.bucket}",
        "key": "asset.c8d6a2d58798bcbd04b1f8482909af4c1ac2e4b56b.e74dd0cff625df3211eed07c8dd4df28.zip",
        "source": "assets/FifoQueue_tf-aws_Function_Asset_8F1F35CA/8AB515962278FB929B706CB7C1D074F4/archive.zip"
      }
    },
    "aws_sqs_queue": {
      "FifoQueue_tf-aws_SqsQueue_2036D4D5": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/FifoQueue/tf-aws/SqsQueue",
            "uniqueId": "FifoQueue_tf-aws_SqsQueue_2036D4D5"
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
