bring cloud;
bring aws;
bring "./iconfig.w" as ic;
bring "@cdktf/provider-aws" as tfaws;

pub class Config impl ic.IConfig {
    extern "./config.tfaws.ts" pub static inflight fetchParameterValue(key: str): str;
    key: str;
    
    init(props: ic.ConfigProps) {
        this.key= "/wing-cloud/apps/config/staging/${props.name}";
        new tfaws.ssmParameter.SsmParameter(
            name: this.key,
            type: "String",
            value: props.value,
        );
    }

    pub inflight get(): str {
        return Config.fetchParameterValue(this.key);
    }

    pub onLift(host: std.IInflightHost, ops: Array<str>) {        
        log("onLift called on Config with ops ${ops} ${host}");
        if let host = aws.Function.from(host) {
            host.addPolicyStatements(aws.PolicyStatement {
                actions: ["ssm:GetParameter"],
                // we'll have to see if that's causing cyclic dependencies
                resources: ["arn:aws:ssm:us-east-1:110379683389:parameter${this.key}"],  
                effect: aws.Effect.ALLOW,
              });
        }
    }
}