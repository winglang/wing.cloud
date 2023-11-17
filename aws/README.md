# AWS Account Bootstrapping for Github Actions and Terraform State

This is configuring

- [./tfstate](./tfstate/): A versioned S3 Bucket for Terraform state and a Dynamodb table for Terraform state locking to be used in a [S3 Backend](https://developer.hashicorp.com/terraform/language/settings/backends/s3) 
- [./oidc](./oidc/): [Github OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) access for Github Actions from the `wing.cloud` repository

for the following AWS Accounts

- staging: `891197207596`
- production: `108269615366`

The Terraform state is persisted in S3 buckets in the respective AWS account. While this script has to be applied locally, it can be done from any machine with access to the AWS account.

- staging: `wingcloud-tfstate-staging`
- production: `wingcloud-tfstate-production`

The buckets and therefore the state are versioned. 

The Dynamodb tables are:

- staging: `wingcloud-tfstate-lock-staging`
- production: `wingcloud-tfstate-lock-production`

And example S3 backend configuration using this would look like this:

```
terraform.backend = {
  s3: {
    bucket: `wingcloud-tfstate-staging`,
    region: 'us-east-1',
    key: `your/uniue/state/path/terraform.tfstate`,
    dynamodb_table: `wingcloud-tfstate-lock-staging`
  }
}
```

## Setup

```
pnpm install
```

This needs the Wing CLI with platforms support (>= 0.44.0)

## AWS Prerequisites

The scripts will fail if none or wrong AWS session is found. You can sign via SSO https://wingcloud.awsapps.com/start and you should [configure](https://docs.aws.amazon.com/cli/latest/userguide/sso-configure-profile-token.html) your local environment to use it.

Here's an example `~/.aws/config` excerpt:

```yaml
[profile wing-cloud-production]
sso_session = wing
sso_account_id = 108269615366
sso_role_name = AWSAdministratorAccess
region = us-east-1
output = json

[profile wing-cloud-staging]
sso_session = wing
sso_account_id = 891197207596
sso_role_name = AWSAdministratorAccess
region = us-east-1
output = json

[sso-session wing]
sso_start_url = https://wingcloud.awsapps.com/start/
sso_region = us-east-1
sso_registration_scopes = sso:account:access
```

with that in place you can perform a sign in:

```
aws sso login
```

and configure your profile via 

```
export AWS_PROFILE=wing-cloud-staging
```

This will then be used by the AWS CLI, AWS SDKs and therefore Terraform as well. You'll need the Terraform CLI `>= 1.6` to work with this AWS config layout. With homebrew this can be done like this

```
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

## Usage

The actual deployment is pretty straightforward and wrapped in a [shell script](./bin/deploy-all).

Make sure to have a valid AWS session for the AWS Account on your machine. This assumes an AWS config setup as described above with the aws profiles `wing-cloud-staging` / `wing-cloud-production` being available and authenticated.

### Plan 

Performs a dry run in all accounts

```
./bin/plan-all
```

### Deploy

Performs a deployment in all accounts

```
./bin/deploy-all
```

#### Deploy single account

```
./bin/deploy-all testing
```

## Dev

The actual wing code lives in these two folders

 - [./oidc](./oidc/)
 - [./tfstate](./tfstate/)

 The binaries are in [./bin](./bin/)