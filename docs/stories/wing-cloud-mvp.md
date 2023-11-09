# Wing Cloud 1.0 - Requirements Specification

This document specifies the requirements for version 1.0 of the Wing Cloud.

Wing Cloud is a service for delivering applications written using the *Wing Framework* to production. The *Wing Framework* is a programming environment for cloud applications. The framework is available for Winglang and for TypeScript and consists of an SDK, IDE tooling and the local version of the Wing Console.

Key features that differentiate the Wing Framework:
* Programmatic infrastructure definitions
* Local cloud simulation
* End to end testing capabilities
* Portability across providers

While the *Wing Framework* covers the **development stage** in the application lifecycle, *Wing Cloud* covers the activities required to deliver applications successfully to production. This includes **build**, **test**, **preview**, **deploy** and **operate**.

```
    develop     -> build -> test -> preview -> deploy > operate
<-------------->  <-------------------------------------------->
 Wing Framework                    Wing Cloud
```

## Taxonomy

* **App** - a unit of deployment.
* **Repository** - where the source code of an application is managed (currently only GitHub is supported).
* **Environment** - a space with a stable address where an instance of the application is deployed.
* **Preview** - a special type of an ephemeral environment which can be deployed ad-hoc and cleaned up quickly.
* **Platform** - a concrete implementation of the Wing Cloud Library (e.g. `tf-aws`, `awscdk`).
* **Entrypoint** - the name of the application entrypoint file (defaults to `main.w`).
* **Team** - a billable account that owns applications and can be accessed by a set of users.
* **User** - identified by a GitHub login

Granularity:

| Entity      | `?:?` | Entity      |
|-------------|-------|-------------|
| App         | `1:1` | Repository  |
| App         | `1:1` | Entrypoint  |
| App         | `1:N` | Environment |
| App         | `1:N` | Preview     |
| Environment | `1:1` | Platform    |
| Team        | `1:N` | App         |
| Team        | `1:N` | User        |

## Scope of 1.0

The focus of v1.0 of Wing Cloud is to optimize "time to value". In our case, it's the time it takes from the creation of a Wing Cloud app (or from a new commit into this app) to when there are public available endpoints.

High-level requirements:

* Wing Cloud 1.0 *should support* Winglang and TypeScript as source languages
* Wing Cloud 1.0 *should support* all resources in the Wing SDK
* Wing Cloud 1.0 *should support* containerized workloads (`cloud.Workload`)
* Wing Cloud 1.0 *should support* accessing endpoints exposed by Wing applications (e.g. `cloud.Website`, `cloud.Api`)
* Wing Cloud 1.0 *should support* external SSL terminated endpoints with custom domains
* Wing Cloud 1.0 should automatically create preview environments for all PRs
* Wing Cloud 1.0 should allow interacting with all preview and production environments via a Wing Console experience
* Wing Cloud 1.0 *is not required* to support highly-available or highly-scalable applications
* Wing Cloud 1.0 *is not required* to support arbitrary Terraform resources
* Wing Cloud 1.0 *is not required* to support BYOA (bring your own account).

This section is organized according to the following user flows:

* Create: creation of new Wing Cloud applications
* Preview: preview environments
* Deploy: deployment to production
* Operate: operating the app in production

### Out of scope for v1.0

* Bring your own account
* Deploy to AWS, GCP or Azure using Terraform
* Multiple environments per app (e.g. staging/pre-production)
* Project templates
* Running tests against production (use `cloud.Function`s for now).
* Customization of build process. It's always `npm i && wing compile -t TARGET`

## Create

Every Wing Cloud app is connected to a GitHub repository and associated with an entrypoint within this repository (e.g. `main.w` or `main.ts`).

When a user creates an app through the website they can choose whether they want to *create a new GitHub  repository* or *connect to an existing* one.

If they create a new repository, they can select a template to populate the repository. It should be possible to add additional templates to the Wing Cloud service as we evolve our 

If they choose to connect to an existing repository, the UI will look for potential entrypoints (e.g. `main.w` files) and will give users the option to select the entrypoint (unless there's only one and then that's going to be the default selected option).

A default `name` for the app will also be proposed to the user based on the repository name (e.g. if the repository name is `eladb/my-app` then the proposed appid will be `my-app`). If there is already an app with that name, then an ordinal suffix will be added (e.g. `my-app-2`).

## Preview

A preview environment will be automatically created when someone submits a pull request to the app's GitHub repository.

Users should be able to store **secrets** for preview environments. The same set of secrets will apply to all preview environments created for this app and will be accessible through `cloud.Secret` objects.

As soon as a pull request is created, Wing Cloud will post a comment into the pull request which will include the following information:

* Build status
* Test status (and a way to view detailed test results)
* Deployment status
* Once deployed, link to the Wing Console UI for this environment
* Once deployed, links to all exposed endpoints of this app

For security reasons, all URLs of preview environments (both for console access and exposed endpoints) should include a security token so that it won't be possible to guess these URLs.

For each app, users should be able to view a list of all active preview environments in the Wing Cloud website, and for each environment, they will be able to operate on it (see [Operate](#operate)).
## Deploy

In v1.0 of Wing Cloud, every Wing application will have a single production environment associated with its main branch.

> **Note**: applications will be deployed to a special proprietary Wing platform, where some of the resources are based on the simulator and some are based on other cloud service providers. Functions and workloads could be hosted in fly.io. Persistent resources such as buckets and queues are stored in volumes attached to the fly.io machines or in AWS.

Every time a commit is pushed to the main branch, Wing Cloud will automatically build and deploy a new instance of the application to the production environment.

Once deployment is complete, an email will be sent to the user indicating that deployment is complete and includes links to the environment's console and public endpoints.

## Operate

For each environment, Wing Cloud will show the following information:

* **GitHub repository link** and the repository's description from GitHub
* **Build logs**: a **streaming log** of the build, with errors highlighted and linkable to the relevant source code in GitHub.
* **Tests**: if tests were executed during builds (currently only for preview environments), a list of all the tests and their results, as well as logs captured for each test.
* **Endpoints**: a list of public endpoints exposed by the application running in this environment.
* **Console view**: a fully functional Wing Console experience that can be used to interact with the application deployed into this environment (e.g. list the files in the bucket, invoke functions etc).
* **Logs**: live streaming of application logs (not related to tests).
* **Health**: last status of all health checks in the application.

## Configure

Each app has a settings page with the following fields:

* **Name**: the unique name of the application (within the team), cannot be changed once an app is created. The name must be symbolic (lowercase, digits, hyphens). E.g. `my-app-123`
* **Preview?**: if `true`, will automatically create a preview environment for each pull request
* **Environments** (initially this will always include a single `prod` environment). For each:
	* **Enabled?**: whether the environment is enabled
	* **Tracking branch**: the branch being auto-deployed (defaults to `main`)
	* **Platform**: currently always `wcp` (Wing Cloud Platform).
* **Secrets**: for every `cloud.Secret` defined in the application, a secret value must be supplied for each type of environment (preview, prod). If a secret is missing, a **warning** icon will be displayed next to the "Secrets" section as well as on the main view of the app.

### Work plan

* Wing for TypeScript
* Model environment variables
* Endpoints
* Health checks
* `wing bootstrap -t tf-aws`
* Centralized logs on AWS
* Refactor tests view in the console

## URL Scheme

* REST API: https://api.wing.cloud
* Web app: https://wing.cloud

```
/apps/:name
/apps/:name/environments/prod
/apps/:name/environments/preview-*
```
