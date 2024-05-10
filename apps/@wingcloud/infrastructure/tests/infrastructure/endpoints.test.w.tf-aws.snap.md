# `endpoints.test.w.tf-aws.snap.md`

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
      "MakeTable_Field_Handler_CloudwatchLogGroup_DAF314BF": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MakeTable/Table/Field/Handler/CloudwatchLogGroup",
            "uniqueId": "MakeTable_Field_Handler_CloudwatchLogGroup_DAF314BF"
          }
        },
        "name": "/aws/lambda/Handler-c8c54e69",
        "retention_in_days": 30
      }
    },
    "aws_dynamodb_table": {
      "MakeTable_Table_tfaws_DynamodbTable_6C1FBC1C": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MakeTable/Table/Table_tfaws/DynamodbTable",
            "uniqueId": "MakeTable_Table_tfaws_DynamodbTable_6C1FBC1C"
          }
        },
        "attribute": [
          {
            "name": "pk",
            "type": "S"
          },
          {
            "name": "sk",
            "type": "S"
          }
        ],
        "billing_mode": "PAY_PER_REQUEST",
        "hash_key": "pk",
        "name": "data",
        "range_key": "sk",
        "stream_enabled": true,
        "stream_view_type": "NEW_AND_OLD_IMAGES"
      }
    },
    "aws_iam_role": {
      "MakeTable_Field_Handler_IamRole_42A8298F": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MakeTable/Table/Field/Handler/IamRole",
            "uniqueId": "MakeTable_Field_Handler_IamRole_42A8298F"
          }
        },
        "assume_role_policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Action\":\"sts:AssumeRole\",\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},\"Effect\":\"Allow\"}]}"
      }
    },
    "aws_iam_role_policy": {
      "MakeTable_Field_Handler_IamRolePolicy_343101FC": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MakeTable/Table/Field/Handler/IamRolePolicy",
            "uniqueId": "MakeTable_Field_Handler_IamRolePolicy_343101FC"
          }
        },
        "policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":\"none:null\",\"Resource\":\"*\"}]}",
        "role": "${aws_iam_role.MakeTable_Field_Handler_IamRole_42A8298F.name}"
      }
    },
    "aws_iam_role_policy_attachment": {
      "MakeTable_Field_Handler_IamRolePolicyAttachment_DF9394CC": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MakeTable/Table/Field/Handler/IamRolePolicyAttachment",
            "uniqueId": "MakeTable_Field_Handler_IamRolePolicyAttachment_DF9394CC"
          }
        },
        "policy_arn": "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        "role": "${aws_iam_role.MakeTable_Field_Handler_IamRole_42A8298F.name}"
      }
    },
    "aws_lambda_function": {
      "MakeTable_Field_Handler_FACFF83E": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MakeTable/Table/Field/Handler/Default",
            "uniqueId": "MakeTable_Field_Handler_FACFF83E"
          }
        },
        "architectures": [
          "arm64"
        ],
        "environment": {
          "variables": {
            "NODE_OPTIONS": "--enable-source-maps",
            "WING_FUNCTION_NAME": "Handler-c8c54e69",
            "WING_TARGET": "tf-aws",
            "WING_TOKEN_TFTOKEN_TOKEN_0": "${jsonencode(aws_dynamodb_table.MakeTable_Table_tfaws_DynamodbTable_6C1FBC1C.name)}"
          }
        },
        "function_name": "Handler-c8c54e69",
        "handler": "index.handler",
        "memory_size": 1024,
        "publish": true,
        "role": "${aws_iam_role.MakeTable_Field_Handler_IamRole_42A8298F.arn}",
        "runtime": "nodejs20.x",
        "s3_bucket": "${aws_s3_bucket.Code.bucket}",
        "s3_key": "${aws_s3_object.MakeTable_Field_Handler_S3Object_028EDAE0.key}",
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
      "MakeTable_Field_Handler_S3Object_028EDAE0": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/MakeTable/Table/Field/Handler/S3Object",
            "uniqueId": "MakeTable_Field_Handler_S3Object_028EDAE0"
          }
        },
        "bucket": "${aws_s3_bucket.Code.bucket}",
        "key": "asset.c8c54e697f45cd85a763a59bf99efa3d1d8b4dac6c.5c7fb141cc428630b5ebc0f4a87390eb.zip",
        "source": "assets/MakeTable_Field_Handler_Asset_3F830041/F6F3792BA41D287DA90CE98EC5D823D4/archive.zip"
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
