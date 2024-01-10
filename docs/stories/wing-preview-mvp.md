# Wing Preview 1.0 - Requirements Specification

This document specifies the requirements for version 1.0 of the Wing Preview.

Wing Preview is a service for providing applications written using the *Wing Framework* preview environments running on Wing Cloudlet. The *Wing Framework* is a programming environment for cloud applications. The framework is available for Winglang and for TypeScript and consists of an SDK, platform providers, IDE tooling and the local version of the Wing Console.

Key features that differentiate the Wing Framework:
* Programmatic infrastructure definitions
* Local cloud simulation
* End to End testing capabilities
* Portability across providers

While the *Wing Framework* covers the **development stage** in the application lifecycle, *Wing Preview* covers the activities required to deliver better applications. This includes **build**, **test**, **preview**, **deploy to Wing Cloudlet** and **operate**.

```
    develop     -> build -> test -> preview -> deploy to Wing Cloudlet > operate
<-------------->  <------------------------------------------------------------->
 Wing Framework                          Wing Preveiw
```

## Taxonomy

* **App** - a unit of deployment.
* **Library** - a reusable package published to an npm repository (private or public) and consumed by other libraries or apps. As far as Wing Preview is concerned, libraries are simply npm modules installed using `npm install` during build.
* **Repository** - where the source code of an application is managed (currently only GitHub is supported).
* **Environment** - a space with a stable address where an instance of the application is deployed. In v1.0 each app can have multiple *preview* environments (associated with PR branches) and a single *production* environment (associated with the `main` branch of the repository).
* **Environment Type** - for v1.0 we have only *preview* and *production*.
* **Branch** - a git repository branch. Each environment tracks a particular git branch.
* **Preview** - a type of an ephemeral environment which can be deployed ad-hoc and cleaned up quickly.
* **Platform** - a concrete implementation of the Wing Preview Library (e.g. `tf-aws`, `awscdk`). Wing Preview 1.0 will support `sim` target only (will be deployed to Wing Previewlet)
* **Entrypoint** - the name of the application entrypoint file (defaults to `main.w`).
* **User** - identified by a GitHub login
* **Input** - a value needed by an app in order to operate. They are stored securely (encrypted at rest) in Wing Preview and served to the application's environment to be consumed by the app during preflight and inflight. Inputs are defined as part of the application code and Wing Preview allows users to associate values to these inputs per environment type (preview/prod).
* **Endpoint** - represents a publicly accessible endpoint

Granularity:

| Entity      | `?:?` | Entity      |
|-------------|-------|-------------|
| App         | `1:1` | Repository  |
| App         | `1:1` | Entrypoint  |
| App         | `1:N` | Environment |
| App         | `1:N` | Preview     |
| App         | `1:N` | Library     |
| Environment | `1:1` | Platform    |
| Environment | `1:1` | Branch      |
| Environment | `1:N` | Input       |

## Scope of 1.0

The focus of v1.0 of Wing Preview is to optimize "time to value". In our case, it's the time it takes from sign-up and the creation of a sample Wing Preview app (or from a new commit into this app) to when there are public available endpoints.

High-level requirements:

* Wing Preview 1.0 *should support* Winglang and TypeScript as source languages
* Wing Preview 1.0 "time to value" (*from sign up to sample app in production running on a cloudlet*) will be under 1 minute.
* Wing Preview 1.0 *should support* all the resources in the Wing SDK (the `cloud` library). 
* Wing Preview 1.0 should support all trusted libraries (`@winglibs`)
* Wing Preview 1.0 *should support* containerized workloads (`cloud.Workload`)
* Wing Preview 1.0 *should support* accessing endpoints exposed by Wing applications from the outside world using unique URLs allocated for each environment (e.g. `cloud.Website`, `cloud.Api`)
* Wing Preview 1.0 *should support* external SSL terminated endpoints with custom domains
* Wing Preview 1.0 should automatically create preview environments for all PRs
* Wing Preview 1.0 *should allow* interacting with all preview and production environments via a Wing Console experience
* Wing Preview 1.0 *will only support* a "free tier" (cloudlet platform) designed for prototypes and simple apps.

### Out of scope for v1.0

The following is a list of future capabilities that we plan to implement at a later release:

* Wing Preview 1.0 *is not required* to support arbitrary AWS/GCP/Azure Terraform resources
* Wing Preview 1.0 *is not required* to support highly-available or highly-scalable applications
* Wing Preview 1.0 *is not required* to support BYOA (bring your own account). Supporting this
  requires implementing the Terraform deployment UX as well as Wing Console in production and those
  are big features to implement.
* Wing Preview 1.0 *is not required* to deploy to AWS, GCP or Azure using Terraform
* Wing Preview 1.0 *is not required* to support a paid tier for production deployments
* Wing Preview 1.0 *is not required* to support multiple environments per app (e.g. staging/pre-production)
* Wing Preview 1.0 *is not required* to support project templates
* Wing Preview 1.0 *is not required* to support running tests against production (use `cloud.Function`s for now).
* Wing Preview 1.0 *is not required* to support customization of build process. It's always `npm i && wing compile -t TARGET`
* Wing Preview 1.0 *is not required* to support publishing/consuming libraries is not handled by Wing Console, but rather just uses standard npm repositories.
* Wing Preview 1.0 *is not required* to support teams and user management

## Create flow

Every Wing Preview app is connected to a GitHub repository and associated with an entrypoint within this repository (e.g. `main.w` or `main.ts`).

### Repository

When a user creates an app through https://wing.cloud they can *connect to an existing* repository.

### Entrypoint for existing repositories

When selecting an existing repository, the entrypoint needs to be determined.
The UI will query GitHub and look for potential entrypoints (e.g. `main.w` files) and will give users the option to select the entrypoint. The selection will default to `main.w` or if there is only one possible entrypoint, it will be the selected option.

If there are already pull request branches in For v1.0 there is no need to create preview environments for the existing pull requests.

### App name

The `name` for the app will be based on the repository name (e.g. if the repository name is `eladb/my-app` then the proposed appid will be `my-app`). If the team already has an app with that name, then a suffix will be added (e.g. `my-app-2`).

### Environments

When creating a new app, we will show the list of environments defined for this app, but in v1.0 this UI will only be **read-only**.

The UI will show:

1. PR branches are deployed to preview environments.
2. `main` branch is deployed to a production environment on top of cloudlet platform.


## Preview flow

A preview environment will be automatically created when a user submits a pull request to the app's repository.

P2: If the author of the PR is not a registered Wing Preview user, Wing Preview will add a comment to the PR instructing them to sign up. Once this user signs up, the preview environment will be created only after another commit is pushed to the repository (not ideal behavior but okay to get started).

The environment will automatically be updated every time a commit is pushed to this branch.

State and endpoints should be preserved across updates of preview environments.

### Preview environment inputs

Users should be able to set the input values for preview environments. The same set of input values will apply to all preview environments created for this app.

If an input value is updated, the new value will only be picked up when a new commit is pushed.

### Pull request comments

As soon as a pull request is created, Wing Preview will post a comment into the pull request which will include the following information:

* P1: Build status
* P1: Test status and a way to view detailed test results.
* P1: Link to the Wing Preview page of this environment, which is where the Wing Console UI will show for this environment. This is a link looks like this: https://wing.cloud/:team/:app/:branch and can only be accessed by authenticated Wing Preview users.
* P1: Once deployed is complete, links to all exposed endpoints of this app such as websites and REST APIs. These endpoints provide *direct access* to the application and **don't go through additional Wing Preview authentication** (see [Application Endpoints](#application-endpoints) below).

### Preview environment page

For each app in the Wing Preview web app, users should be able to view a list of all active preview environments in the Wing Preview website, and for each environment, they will be able to operate on it through a Wing Console experience (see [Operate](#operate)).

## Deploy flow

In v1.0 of Wing Preview, every Wing app will have a single production environment associated with its main branch.

The free tier of Wing Preview, which is the only tier we are launching for the MVP, leverages the same approach we use for preview environments (simulator instance deployed to a fly.io machine, AKA Wing Cloudlet).

When a commit is pushed to the main branch, Wing Preview will automatically build and deploy a new instance of the application to the production environment.

The build, test and deployment status will be displayed and updated live in the environment page in the Wing Preview web app.

## Operate flow

Each environment (both production and preview) will have a page in the Wing Preview web app (e.g. https://wing.cloud/monadahq/hello/main). This page will include both the deployment status and console interaction for this environment:

* **GitHub repository link** and the repository's description from GitHub
* **Build and deployment logs**: a **streaming log** of the build.
* **Tests**: if tests were executed during builds (currently only for preview environments), a list of all the tests and their results, as well as logs captured for each test.
* **Endpoints**: a list of public endpoints exposed by the application running in this environment.
* **Application Map**: a fully functional "Wing Console" experience that can be used to interact with the application deployed into this environment (e.g. list the files in the bucket, invoke functions etc).
* **Runtime Logs**: live streaming of application logs (not related to tests). It should be possible to scroll back all the way to when the environment was created. For preview environments, this is every commit. For production environments, logs won't be retained across deployments.

## Configure flow

Each app has a settings page with the following configuration:

* **Name**: the unique name of the application (within the user's context), cannot be changed once an app is created. The name must be symbolic (lowercase, digits, hyphens). E.g. `my-app-123`.
* **Source**: `repository` (e.g. `monadahq/hello`) and `entrypoint` (e.g. `main.w`).
* **Inputs**: for every "input" defined in the application defined in the application, a secure value must be supplied for each type of environment (preview, prod). If a value is missing for a certain input, a **warning** icon will be displayed next to the "Inputs" section as well as on the main view of the app.

## URLs
### Programmatic API

For v1.0, we won't move to a REST API but it's a P2 and okay if we stay with the RPC-style API for a little longer. Eventually the standard for SaaS products is REST.

The base domain of our REST API will be https://api.wing.cloud

The API will use a hierarchal scheme for the `teams`, `apps` and `envs` collections:

https://api.wing.cloud/teams/TEAM/apps/APP/envs/ENV

Some examples:

* To create a new app to the `monadahq` team, submit a `POST` request to `/teams/monadahq/apps`.
* To get the status of the `prod` environment in the `hello` app, submit a `GET` request to `/teams/monadahq/apps/hello/envs/main`

### Web application

The web app URLs should look like this:

https://wing.cloud/TEAM/APP/ENV

Action pages such as "new app" should use an `?action=ACTION` parameter (P2).

For example:

* https://wing.cloud/monadahq/hello is the main dashboard for the `monadahq/hello` app.
* https://wing.cloud/monadahq/hello/main is the environment associated with the `main` branch (status + console).
* https://wing.cloud/add - the new application page (P1)
* https://wing.cloud/add/conenct - the new application page - connect to existing repository page (P1)
* https://wing.cloud/monadahq?action=new-app - the new application page (P2)
* 
### Application endpoints

For each public endpoint exposed by an app (e.g. a website or a REST API endpoint), Wing Preview will allocate a random `endpointid` which cannot be guessed and used as the subdomain. Traffic that goes to these hosts will reach directly to the application.

We propose this scheme:

`https://<endpointid>.wingcloud.dev`

For example: https://v1stgxr8z5.wingcloud.dev

### Authentication

Everything under https://wing.cloud (or https://api.wing.cloud, which includes the wing console view for preview/prod environments), should be authenticated with a Wing Preview user.

The https://xxx.wingcloud.dev endpoints which represent exposed endpoints from environments are not required to be authenticated so they must have an unguessable domain name.

## Work plan dependencies

This section includes a list of major capabilities required to implement 1.0.

* [Wing for TypeScript](https://github.com/winglang/wing/issues/4842) - allow building applications in TypeScript and consuming any Wing libraries from TypeScript.
* [Inputs](https://github.com/winglang/wing/issues/2726) - formal modeling of environment variables and secrets

## FAQ
### Why are we including Wing for TypeScript in this spec?

From an engineering and execution standpoint, Wing for TypeScript and Wing Preview 1.0 are two different tracks, and we can manage and release them independently. 

From a launch/marketing perspective, we think that supporting TypeScript will be needed initially if we want people to be able to get to production with Wing Preview 1.0, which implies it's part of the MVP. We want to make sure we reduce the barrier for customers as much as possible so that we can provide as much value to as many people as possible as part of this launch.

We will make the final decision about the launch closer to the date.

### What's the target platform for production?

In v1.0 we will only support the free tier for production in Wing and as such it doesn't require to support large scale and highly available applications.

The idea is to use the Wing Simulator deployed to Fly.io machines as the basis for the free tier platform.

The main missing capability in the simulator in order to support this is the ability to persist and restore state across updates. Today, every time the simulator starts, all resources start from an empty state. This naturally won't work for production.

The idea is to create a persistency system for simulator resources (likely file system based).  This will allow resources to load/save their state upon initialization and shutdown. State should be located using the construct node path (or node address), which is expected to stay stable across updates (as long as the node path or identity was not changed in the app). This basically relies on the foundation we already have for construct paths.

We should also make sure that containers are able to store state, which is one of the reasons I think the underlying mechanism should be eventually be a file system volume (volumes are also commonly supported in container-orchestration systems such as fly.io).