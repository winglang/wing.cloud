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
* **Library** - a reusable package published to an npm repository (private or public) and consumed by other libraries or apps. As far as Wing Cloud is concerned, libraries are simply npm modules installed using `npm install` during build.
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
* Wing Cloud 1.0 *should support* all the resources in the Wing SDK (the `cloud` library). 
* Wing Cloud 1.0 should support all trusted libraries (`@winglibs`)
* Wing Cloud 1.0 *should support* containerized workloads (`cloud.Workload`)
* Wing Cloud 1.0 *should support* accessing endpoints exposed by Wing applications from the outside world using unique URLs allocated for each environment (e.g. `cloud.Website`, `cloud.Api`)
* Wing Cloud 1.0 *should support* external SSL terminated endpoints with custom domains
* Wing Cloud 1.0 should automatically create preview environments for all PRs
* Wing Cloud 1.0 *should allow* interacting with all preview and production environments via a Wing Console experience
* Wing Cloud 1.0 *will only support* a "free tier" designed for prototypes and simple apps.
* Wing Cloud 1.0 *will allow* users to "join the waitlist" for a paid tier designed for production use cases.
### Out of scope for v1.0

The following is a list of future capabilities that we plan to implement at a later release:

* Wing Cloud 1.0 *is not required* to support arbitrary AWS/GCP/Azure Terraform resources
* Wing Cloud 1.0 *is not required* to support highly-available or highly-scalable applications
* Wing Cloud 1.0 *is not required* to support BYOA (bring your own account). Supporting this
  requires implementing the Terraform deployment UX as well as Wing Console in production and those
  are big features to implement.
* Wing Cloud 1.0 *is not required* to deploy to AWS, GCP or Azure using Terraform
* Wing Cloud 1.0 *is not required* to support a paid tier for production deployments
* Wing Cloud 1.0 *is not required* to support multiple environments per app (e.g. staging/pre-production)
* Wing Cloud 1.0 *is not required* to support project templates
* Wing Cloud 1.0 *is not required* to support running tests against production (use `cloud.Function`s for now).
* Wing Cloud 1.0 *is not required* to support customization of build process. It's always `npm i && wing compile -t TARGET`
* Wing Cloud 1.0 *is not required* to support publishing/consuming libraries is not handled by Wing Console, but rather just uses standard npm repositories.
* Wing Cloud 1.0 *is not required* to support multiple entrypoints. Every app has a single entrypoint.

This next section is organized according to the following user flows:

* Create: creation of new Wing Cloud applications
* Preview: preview environments
* Deploy: deployment to production
* Operate: operating the app in production

## Create

Every Wing Cloud app is connected to a GitHub repository and associated with an entrypoint within this repository (e.g. `main.w` or `main.ts`).
### Repository

When a user creates an app through the website they can choose whether they want to *create a new GitHub  repository* (P2) or *connect to an existing* one (P1).

> The reason we want to support both connecting to an existing repository and creating a new one is in order to reduce the "time to value". We want people to be able to sign up and immediately see the value of Wing Cloud, so being able to create a new repository is important. It's totally fine to implement these out one by one (technically these features are layered on top of each other), but I think repository creation needs to be part of the launch of 1.0.

### Population of new repositories

When creating a new repository, the repository will be populated with a starter project.

P1: Users won't be able to select from a template and all new repositories will be populated with a a "hello world" template.

P2: Users will be able to select from from a gallery of starter projects to populate the repository. 
### Entrypoint for existing repositories

When selecting an existing repository, the entrypoint needs to be determine.

P1: A text box will allow the user to specify the entrypoint and `main.w` will be the initial value. Users can edit this value manually. No validation needs to be performed against the repository. If the value is wrong (the entrypoint file doesn't exist), there will be an error later and the user will be able to update the entrypoint in **Settings**.

P2: The UI will query GitHub and look for potential entrypoints (e.g. `main.w` files) and will give users the option to select the entrypoint. The selection will default to `main.w` or if there is only one possible entrypoint, it will be the selected option.

### App name

A default `name` for the app will also be proposed to the user based on the repository name (e.g. if the repository name is `eladb/my-app` then the proposed appid will be `my-app`). If the team already has an app with that name, then a suffix will be added (e.g. `my-app-2`).

P2: It will be nice to show a nice green checkbox to indicate if it's possible to use this app name (same design as the GitHub repository creation experience).

## Preview

A preview environment will be automatically created when a user submits a pull request to the app's repository.

P2: If the author of the PR is not a registered Wing Cloud user, Wing Cloud will add a comment to the PR instructing them to sign up. Once this user signs up, the preview environment will be created only after another commit is pushed to the repository (not ideal behavior but okay to get started).

The environment will automatically be updated every time a commit is pushed to this branch.
### Secrets

Users should be able to store **secrets** for preview environments. The same set of secrets will apply to all preview environments created for this app and will be accessible through `cloud.Secret` objects.

If a secret is updated, the new value will only be picked up when a new commit is pushed.
### Pull request comments

As soon as a pull request is created, Wing Cloud will post a comment into the pull request which will include the following information:

* P1: Build status
* P1: Test status and a way to view detailed test results.
* P1: Link to the Wing Cloud page of this environment, which is where the Wing Console UI will show for this environment. This is a link looks like this: https://wing.cloud/:team/:app/:branch and can only be accessed by authenticated Wing Cloud users that are part of this team.
* P1: Once deployed is complete, links to all exposed endpoints of this app such as websites and REST APIs. These endpoints provide *direct access* to the application and **don't go through additional Wing Cloud authentication**. Therefore we should use a random subdomain so that it won't be possible to guess these domain names without sharing them. For example, https://j8ksnsjd84.:team.:app.wingcloud.dev will point to 
### Environment Page

For each app in the Wing Cloud web app, users should be able to view a list of all active preview environments in the Wing Cloud website, and for each environment, they will be able to operate on it through a Wing Console experience (see [Operate](#operate)).
## Deploy

In v1.0 of Wing Cloud, every Wing app will have a single production environment associated with its main branch.

The free tier of Wing Cloud, which is the only tier we are launching for the MVP, leverages the same approach we use for preview environments (simulator instance deployed to a fly.io machine).

When a commit is pushed to the main branch, Wing Cloud will automatically build and deploy a new instance of the application to the production environment.

P2: Every time a new deployment is complete, an **email** will be sent to all team members which indicates that deployment is complete and includes links to the environment in Wing Cloud and all public endpoints exposed by this environment.

The build, test and deployment status will be displayed and updated live in the environment page in the Wing Cloud web app.
## Operate

Each environment (both production and preview) will have a page in the Wing Cloud web app (e.g. https://wing.cloud/monadahq/hello/prod). This page will include both the deployment status and console interaction for this environment:

* **GitHub repository link** and the repository's description from GitHub
* **Build logs**: a **streaming log** of the build, with errors highlighted and linkable to the relevant source code in GitHub.
* **Tests**: if tests were executed during builds (currently only for preview environments), a list of all the tests and their results, as well as logs captured for each test.
* **Endpoints**: a list of public endpoints exposed by the application running in this environment.
* **Console**: a fully functional Wing Console experience that can be used to interact with the application deployed into this environment (e.g. list the files in the bucket, invoke functions etc).
* **Logs**: live streaming of application logs (not related to tests).
* **Checks**: the last status of all the `cloud.Check` resources within in the application.
## Configure

Each app has a settings page with the following fields:

* **Name**: the unique name of the application (within the team), cannot be changed once an app is created (P1). The name must be symbolic (lowercase, digits, hyphens). E.g. `my-app-123`. Name changes are P2.
* **Source**: `repository` and `entrypoint`.
* **Environments** (initially this will always include an entry for preview environments and a single `prod` environment). For each:
	* **Enabled?**: whether the environment is enabled for automatic deployment
	* **Tracking branch**: the branch being auto-deployed (defaults to `main`)
	* **Platform**: currently always `wcp` (Wing Cloud Platform).
	* **Secrets**: a page where you can set secrets for this environment (see next)
* **Secrets**: for every `cloud.Secret` defined in the application, a secret value must be supplied for each type of environment (preview, prod). If a secret is missing, a **warning** icon will be displayed next to the "Secrets" section as well as on the main view of the app.
### Work plan

* Wing for TypeScript
* Simulator state persistency
* Environment variables and secrets
* Endpoints
* Cloud checks (cloud.Check)
* Tests view in the console
* Migrate `ex` to `@winglibs`

## URL Scheme

* Web app: https://wing.cloud
### REST API

The base domain of our REST API will be https://api.wing.cloud

The API will use a hierarchal scheme for the `teams`, `apps` and `envs` collections:

https://api.wing.cloud/teams/TEAM/apps/APP/envs/ENV

Some examples:

* To create a new app to the `monadahq` team, submit a `POST` request to `/teams/monadahq/apps`.
* To get the status of the `prod` environment in the `hello` app, submit a `GET` request to `/teams/monadahq/apps/hello/envs/prod`

### Web application

The web app URLs should look like this:

https://wing.cloud/TEAM/APP/ENV

For example:

* https://wing.cloud/monadahq/hello is the main dashboard for the `monadahq/hello` app.
* https://wing.cloud/monadahq/hello/prod is the `prod` environment (status + console).
### Application endpoints

For each public endpoint exposed by an app (e.g. a website or a REST API endpoint), Wing Cloud will allocate a random `endpointid` which cannot be guessed and used as the subdomain. Traffic that goes to these hosts will reach directly to the application.

We propose this scheme:

`https://<endpointid>.wingcloud.dev`

For example: https://v1stgxr8z5.wingcloud.dev
