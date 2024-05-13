# `secrets.test.w.tf-aws.snap.md`

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
      "Secrets_Table_Field_Handler_CloudwatchLogGroup_69393A0E": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/Secrets/Table/Field/Handler/CloudwatchLogGroup",
            "uniqueId": "Secrets_Table_Field_Handler_CloudwatchLogGroup_69393A0E"
          }
        },
        "name": "/aws/lambda/Handler-c82e8394",
        "retention_in_days": 30
      }
    },
    "aws_dynamodb_table": {
      "Secrets_Table_Table_tfaws_DynamodbTable_A7E01FE2": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/Secrets/Table/Table_tfaws/DynamodbTable",
            "uniqueId": "Secrets_Table_Table_tfaws_DynamodbTable_A7E01FE2"
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
        "name": "secrets",
        "range_key": "sk",
        "stream_enabled": true,
        "stream_view_type": "NEW_AND_OLD_IMAGES"
      }
    },
    "aws_iam_role": {
      "Secrets_Table_Field_Handler_IamRole_BC815B3C": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/Secrets/Table/Field/Handler/IamRole",
            "uniqueId": "Secrets_Table_Field_Handler_IamRole_BC815B3C"
          }
        },
        "assume_role_policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Action\":\"sts:AssumeRole\",\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},\"Effect\":\"Allow\"}]}"
      }
    },
    "aws_iam_role_policy": {
      "Secrets_Table_Field_Handler_IamRolePolicy_67B57138": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/Secrets/Table/Field/Handler/IamRolePolicy",
            "uniqueId": "Secrets_Table_Field_Handler_IamRolePolicy_67B57138"
          }
        },
        "policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":\"none:null\",\"Resource\":\"*\"}]}",
        "role": "${aws_iam_role.Secrets_Table_Field_Handler_IamRole_BC815B3C.name}"
      }
    },
    "aws_iam_role_policy_attachment": {
      "Secrets_Table_Field_Handler_IamRolePolicyAttachment_9B30AEB6": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/Secrets/Table/Field/Handler/IamRolePolicyAttachment",
            "uniqueId": "Secrets_Table_Field_Handler_IamRolePolicyAttachment_9B30AEB6"
          }
        },
        "policy_arn": "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        "role": "${aws_iam_role.Secrets_Table_Field_Handler_IamRole_BC815B3C.name}"
      }
    },
    "aws_kms_key": {
      "Secrets_Crypto_KmsKey_35A9552B": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/Secrets/Crypto/Crypto/KmsKey",
            "uniqueId": "Secrets_Crypto_KmsKey_35A9552B"
          }
        }
      }
    },
    "aws_lambda_function": {
      "Secrets_Table_Field_Handler_1B0F5225": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/Secrets/Table/Field/Handler/Default",
            "uniqueId": "Secrets_Table_Field_Handler_1B0F5225"
          }
        },
        "architectures": [
          "arm64"
        ],
        "environment": {
          "variables": {
            "NODE_OPTIONS": "--enable-source-maps",
            "WING_FUNCTION_NAME": "Handler-c82e8394",
            "WING_TARGET": "tf-aws",
            "WING_TOKEN_TFTOKEN_TOKEN_0": "${jsonencode(aws_dynamodb_table.Secrets_Table_Table_tfaws_DynamodbTable_A7E01FE2.name)}"
          }
        },
        "function_name": "Handler-c82e8394",
        "handler": "index.handler",
        "memory_size": 1024,
        "publish": true,
        "role": "${aws_iam_role.Secrets_Table_Field_Handler_IamRole_BC815B3C.arn}",
        "runtime": "nodejs20.x",
        "s3_bucket": "${aws_s3_bucket.Code.bucket}",
        "s3_key": "${aws_s3_object.Secrets_Table_Field_Handler_S3Object_84E10D95.key}",
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
      "Secrets_Table_Field_Handler_S3Object_84E10D95": {
        "//": {
          "metadata": {
            "path": "root/Default/Default/Secrets/Table/Field/Handler/S3Object",
            "uniqueId": "Secrets_Table_Field_Handler_S3Object_84E10D95"
          }
        },
        "bucket": "${aws_s3_bucket.Code.bucket}",
        "key": "asset.c82e8394bea3047eafa9e8abdb6b16ddeb90c8a597.6e4419b9265976b974f03e03c0432251.zip",
        "source": "assets/Secrets_Table_Field_Handler_Asset_69958F92/42716E449454A1CE15B59241BB214C3F/archive.zip"
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
