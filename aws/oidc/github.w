bring cloud;
bring "cdktf" as cdktf;
bring "@cdktf/provider-aws" as aws;

class Policy {
  pub name: str;
  pub policy: aws.iamPolicy.IamPolicy;

  init(name: str, file: str) {
    this.name = name;

    let policyAsset = new cdktf.TerraformAsset(
      path: file
    );

    this.policy = new aws.iamPolicy.IamPolicy(
      namePrefix: this.name,
      policy: cdktf.Fn.file(policyAsset.path)
    );
  }
}

pub class Github {
  init(environment: str) {
    // needs to be present once in the account
    let provider = new cdktf.TerraformHclModule(  
      source: "philips-labs/github-oidc/aws//modules/provider",  
      version: "0.7.1"
    ) as "provider";

    // ~~~ Repo winglang/wing.cloud ~~~

    let base = new Policy("github-action", "policy.json");

    let repo = new cdktf.TerraformHclModule(
      source: "philips-labs/github-oidc/aws",
      version: "0.7.1",
      variables: {
        "openid_connect_provider_arn" => provider.get("openid_connect_provider.arn"),
        "repo" => "winglang/wing.cloud",
        "role_name" => "wing-cloud-repo-${environment}",
        "default_conditions" => ["allow_environment"],
        "github_environments" => [environment],
        "role_policy_arns" => [base.policy.arn],
        "conditions" => [{
          "test" => "StringLike",
          "variable" => "token.actions.githubusercontent.com:sub",
          "values" => cdktf.Token.asString(["repo:winglang/wing.cloud:pull_request"])
        }]
      }
    ) as "wing-cloud-repo";

    // get the role arn for the github action
    new cdktf.TerraformOutput(
      value: repo.get("role.arn")
    ) as "role-arn";
  }
}