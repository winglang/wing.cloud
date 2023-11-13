bring cloud;
bring aws;
bring "./iconfig.w" as ic;
bring "@cdktf/provider-aws" as tfaws;

pub class Config impl ic.IConfig {
    extern "./config.tfaws.ts" pub static inflight fetchParameterValue(key: str): str;

    // would be nice to share pre- and inflight, also as a static class attribute or something like this
    // see  https://github.com/winglang/wing/issues/1668
    pub static key(name: str): str {
        return "/wing-cloud/apps/config/staging/${name}";
    }

    pub static inflight keyInflight(name: str): str {
        return "/wing-cloud/apps/config/staging/${name}";
    }

    // can't do static methods yet, see
    // https://github.com/winglang/wing/issues/2583
    pub add(name: str, value: str) {
        new tfaws.ssmParameter.SsmParameter(
            name: Config.key(name),
            type: "String",
            value: value,
        ) as Config.key(name);
    }

    pub inflight get(name: str): str {
        return Config.fetchParameterValue(Config.keyInflight(name));
    }

    pub onLift(host: std.IInflightHost, ops: Array<str>) {        
        log("onLift called on Config with ops ${ops} ${host}");
        if let host = aws.Function.from(host) {
            host.addPolicyStatements(aws.PolicyStatement {
                actions: ["ssm:GetParameter"],
                resources: ["arn:aws:ssm:us-east-1:110379683389:parameter${Config.key("*")}"],  
                effect: aws.Effect.ALLOW,
              });
        }
    }
}