bring cloud;
bring aws;
bring "./iparameter.w" as i;
bring "@cdktf/provider-aws" as tfaws;

pub class Parameter impl i.IParameter {
  extern "./parameter.tfaws.ts" pub static inflight fetchParameterValue(key: str): str;
  key: str;
  arn: str;

  new(props: i.ParameterProps) {
    this.key = "/wing-cloud/apps/config/{props.name}";
    let parameter = new tfaws.ssmParameter.SsmParameter(
      name: this.key,
      type: "String",
      value: props.value,
    );
    this.arn = parameter.arn;
  }

  pub inflight get(): str {
    return Parameter.fetchParameterValue(this.key);
  }

  pub onLift(host: std.IInflightHost, ops: Array<str>) {
    if let host = aws.Function.from(host) {
      host.addPolicyStatements(aws.PolicyStatement {
        actions: ["ssm:GetParameter"],
        resources: [this.arn],
        effect: aws.Effect.ALLOW,
      });
    }
  }
}
