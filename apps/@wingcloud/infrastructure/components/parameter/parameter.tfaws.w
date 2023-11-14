bring cloud;
bring aws;
bring "./iparameter.w" as i;
bring "@cdktf/provider-aws" as tfaws;

pub class Parameter impl i.IParameter {
  extern "./parameter.tfaws.ts" pub static inflight fetchParameterValue(key: str): str;
  key: str;

  new(props: i.ParameterProps) {
    this.key= "/wing-cloud/apps/config/staging/${props.name}";
    new tfaws.ssmParameter.SsmParameter(
      name: this.key,
      type: "String",
      value: props.value,
    );
  }

  pub inflight get(): str {
    return Parameter.fetchParameterValue(this.key);
  }

  pub onLift(host: std.IInflightHost, ops: Array<str>) {
    log("onLift called on Config with ops ${ops} ${host}");
    if let host = aws.Function.from(host) {
      host.addPolicyStatements(aws.PolicyStatement {
        actions: ["ssm:GetParameter"],
        resources: ["arn:aws:ssm:us-east-1:110379683389:parameter${this.key}"],
        effect: aws.Effect.ALLOW,
      });
    }
  }
}