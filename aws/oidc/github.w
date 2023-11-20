bring cloud;
bring "cdktf" as cdktf;
bring "@cdktf/provider-aws" as aws;

class Policy {
  pub name: str;
  pub policy: aws.iamPolicy.IamPolicy;

  new(name: str, file: str) {
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
  new(environment: str) {
    // needs to be present once in the account
    let provider = new cdktf.TerraformHclModule(
      source: "philips-labs/github-oidc/aws//modules/provider",
      version: "0.7.1"
    ) as "provider";

    // ~~~ Repo winglang/wing.cloud ~~~

    let admin = new Policy("github-action", "policy.admin.json") as "admin-policy";

    let repo = new cdktf.TerraformHclModule(
      source: "philips-labs/github-oidc/aws",
      version: "0.7.1",
      variables: {
        "openid_connect_provider_arn" => provider.get("openid_connect_provider.arn"),
        "repo" => "winglang/wing.cloud",
        "role_name" => "wing-cloud-repo-${environment}",
        "github_environments" => [environment],
        "default_conditions" => ["allow_environment"],
        "role_policy_arns" => [admin.policy.arn]
      },

    ) as "wing-cloud-repo";

    // get the role arn for the github action
    new cdktf.TerraformOutput(
      value: repo.get("role.arn")
    ) as "role-arn";


    // Readonly Role

    let readOnly = new aws.dataAwsIamPolicy.DataAwsIamPolicy(
      arn: "arn:aws:iam::aws:policy/ReadOnlyAccess"
    );

    let readOnlyAdditional = new Policy("github-action", "policy.read-only.json") as "read-only-policy";

    let repoReadOnly = new cdktf.TerraformHclModule(
      source: "philips-labs/github-oidc/aws",
      version: "0.7.1",
      variables: {
        "openid_connect_provider_arn" => provider.get("openid_connect_provider.arn"),
        "repo" => "winglang/wing.cloud",
        "role_name" => "wing-cloud-repo-${environment}-read-only",
        "default_conditions" => ["allow_environment"],
        "github_environments" => [environment],
        "role_policy_arns" => [readOnly.arn, readOnlyAdditional.policy.arn]
      }
    ) as "wing-cloud-repo-read-only";

    // get the role arn for the github action
    new cdktf.TerraformOutput(
      value: repoReadOnly.get("role.arn")
    ) as "role-arn-read-only";
  }
}
