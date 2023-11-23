## Typescript support
TBD

## Time to value

### DOD

- Signup to **production** in under 1 minute when running on **wcp**

### Remaining Tasks

- [ ] Stateful simulator
- [ ] Console adjustments to support stateful simulator
- [ ] Performance improvements of provisioning new containers and deploying applications

## Support SDK cloud resources, ex. and Wing trusted libs (@winglibs)

### DOD

- SDK and ex. libs should have a dedicated UI components in Wing Console
- Console support for unsupported resources

### Remaining Tasks

- [ ] `Workload` resource support in the Console
- [ ] `Check` resource support in the Console
- [ ] Add support for `bring ui;` in the Console (P2?)

## Endpoints

### DOD

- accessing endpoints exposed by Wing applications from the outside world using unique URLs allocated for each environment

### Remaining Tasks

- [ ] Provide a way to list endpoint in a Wing application
- [ ] expose endpoints to the internet
- [ ] allocate custom domain for each exposed endpoint for example https://<endpointid>.wingcloud.dev
- [ ] add a list of exposed URLs in the PR comment
- [ ] add a list of exposed URLs in Wing Cloud - environment details page
- [ ] Support external SSL terminated endpoints with custom domains

## Interact with preview and production environments

### DOD

- Preview / production environment is fully intractable in Wing Console.
- Console view of an environment will be accessible to Wing Cloud signed up users
- Console view of an environment will be accessible at:  https://wing.cloud/apps/appName/branch/console

### Remaining Tasks

- none

## Create App flow

### DOD

- Each Wing Cloud App is connected to a single GitHub repository and associated with a single entry point (main.w)
- When users create an app they can choose to connect to an existing repository
- When users create an app they can choose to create a new repository which will be populated with a “Hello world” Wing application template.
- App entrypoint is set to main.w file by default.
- Users are able to change the App entrypoint in App settings page and choose from a list of existing *.main.w files from their repository.
- When an entrypoint is updated, all the Apps’ Preview environments will restart and set to load the new entrypoint.
- App name is the repository name. The user can’t update the App name after creation.
- Prevent users from creating more than one App for the same repository
- Once App is created, it is added to a list of Apps displayed in the users’s Apps page
- App URL should be: https://wing.cloud/apps/appName

### Remaining Tasks

- [ ] create a new repository with Wing app template
- [ ] prevent more than one App for a repository

## Allow users to quickly setup and develop locally

### DOD

- **Clone locally**: a button that shows a command line to copy & paste into your terminal which will clone the repository and install the Wing toolchain locally for development.****

### Remaining Tasks

- [ ] clone locally

## App Setting

### DOD

- Users are able to change the App’s entrypoint
- Users are able to set values to the app inputs (secrets and environment variables)
- App’s setting page URL: https://wing.cloud/apps/appName/settings
- Additional non configurable Apps’ settings: Name, Source
- Additional non configurable Environments’ settings: enabled, tracking branch, platform

### Remaining Tasks

- [ ] Additional non configurable Apps’ settings
- [ ] Additional non configurable Environments’ settings

## Create preview environment flow

### DOD

- When an App is created, a production environment is created automatically from the repository default branch (”main” branch).
- A preview environment is created automatically for each PR.
- The environments will automatically be updated every time a commit is pushed to the branch (PR branch or “main” branch)
- All environments are stateful. Environment endpoints and data are preserved across updates.
- Preview environments Inputs (Secrets and Environment variables) can be set in App settings (for existing environments, new values will only be picked up after an environment update)
- A comments is being added to the PR with details of the preview environment (see Pull request comments section)
- For each App in Wing Cloud webapp, users are able to view a list of all active / inactive preview environments created for this App

### Remaining Tasks

- [ ] Stateful environment - depends on SDK and Console implementation
- [ ] Inputs - environment variables - depends on SDK and Wing Cloud implementation

## Pull request comments

### DOD

- As soon as a pull request is created, Wing Cloud will post a PR comment.
- PR comment should include: Build status, Tests status and link to tests logs, link to preview environment page, link to the preview environment (console), list of endpoints links
- links to Wing Cloud preview environment page and to the preview environment itself (console) can only be accessed by Wing Cloud users
- Endpoints don’t go through any additional Wing Cloud authentication.

### Remaining Tasks

- [ ] links to Tests logs
- [ ] list of endpoints

## Preview Environment page

### DOD

- Preview environment URL: https://wing.cloud/apps/appName/branch
- Preview environment console URL: https://wing.cloud/apps/appName/branch/console
- Each environment (both production and preview) will have a page in the Wing Cloud web app
- Users are able to see build and deployments logs
- Users are able to see tests if they were executed during build including their logs
- Users can view their application in Wing Console
- Users can see a list of public endpoints exposed by the application
- Runtime logs
- Checks

### Remaining Tasks

- [ ] Improve deployment and build logs
- [ ] Improve Tests section and logs
- [ ] Runtime logs - need to discuss
- [ ] Endpoints
- [ ] Checks - need to discuss

## Inputs

### DOD

- for every "input" defined in the application, a secure value must be supplied for each type of environment (preview, prod). If a value is missing for a certain input, a **warning** icon will be displayed next to the "Inputs" section as well as on the main view of the app

### Remaining Tasks

- [ ] warning for missing secretes values

## Team

TBD

## Wing Cloud URLs and REST API

TBD

## Only support free tier

TBD

## Join Waitlist

TBD

## Appendix: tasks related to Winglang/SDK

- [ ] https://github.com/winglang/wing/issues/5038
- [ ] https://github.com/winglang/wing/issues/2726
- [ ] https://github.com/winglang/wing/issues/4806
- [ ] https://github.com/winglang/wing/issues/4810
- [ ] https://github.com/winglang/wing/issues/4842
- [ ] https://github.com/winglang/wing/issues/2430
- [ ] https://github.com/winglang/wing/issues/4556
- [ ] https://github.com/winglang/wing/issues/4887
- [ ] https://github.com/winglang/wing/issues/4914

