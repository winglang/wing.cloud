export class OverrideApiGatewayDeployment {
  constructor() {}

  visit(node: any) {
    if (node.terraformResourceType === "aws_api_gateway_deployment") {
      // override create_before_destroy since it's causing issues with
      // cyclic dependencies see https://github.com/hashicorp/terraform-provider-aws/issues/11344#issuecomment-1521831630
      // should be removed once deployed
      node.lifecycle = {
        create_before_destroy: true,
        ignore_changes: ["triggers"]
      };
    }
  }
}