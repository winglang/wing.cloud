import * as cdktf from "@cdktf/provider-aws";
import type { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { Function } from "@winglang/sdk/lib/target-tf-aws";
import { Construct } from "constructs";

export class EnableConcurrentExecutions {
  constructor(private count: number) {}

  isLambdaFunction(node: Construct): boolean {
    return (
      node &&
      (node as any)["function"] &&
      (node as any)["function"]["terraformResourceType"] ===
        "aws_lambda_function"
    );
  }

  enableConcurrentExecutionsForLambda(node: Construct) {
    const cloudFunction = node as Function;
    const cdktfFunction: LambdaFunction = cloudFunction["function"];
    new cdktf.lambdaProvisionedConcurrencyConfig.LambdaProvisionedConcurrencyConfig(
      node,
      "provisioned-concurrency",
      {
        functionName: cdktfFunction.functionName,
        provisionedConcurrentExecutions: this.count,
        qualifier: cdktfFunction.version,
      },
    );
  }

  visit(node: Construct) {
    if (this.isLambdaFunction(node)) {
      this.enableConcurrentExecutionsForLambda(node);
    }
  }
}
