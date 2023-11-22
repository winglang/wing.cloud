# `@wingcloud/monorepo`

> [!NOTE]
> We recommend installing these dependencies globally:
>
> - [@antfu/ni](https://github.com/antfu/ni): `pnpm install @antfu/ni --global`
> - [projen](https://github.com/projen/projen): `pnpm install projen --global`
> - [turbo](https://github.com/vercel/turbo): `pnpm install turbo --global`

## Setup

Install the dependencies:

```sh
ni
```

Go to the `infrastructure` package:

```sh
cd apps/@wingcloud/infrastructure
```

Copy the `.env.example` file into `.env`:

```sh
cp .env.example .env
```

Complete the missing `.env` variables (commented variables are optional).

### Creating the App Secret

For the `APP_SECRET` environment variable, you can generate a random string with the following command:

```sh
openssl rand -hex 32
```

### Creating the GitHub App

For the `BOT_GITHUB_*` variables, you'll need a [GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app).

- The Homepage URL doesn't matter
- The Callback URL should be `http://localhost:3900/wrpc/github.callback`
- Enable `Request user authorization (OAuth) during installation`
- Enable the Webhook. The URL will be updated after the first deployment
- Set a Webhook Secret (e.g. `openssl rand -hex 32`). Remember to specify the webhook secret in the `.env` file
- Enable SSL verification
- The required permissions are:
  - Contents: Read Only
  - Issues: Read & Write
  - Metadata: Read Only
  - Pull Requests: Read & Write
- The required events are:
  - Pull Request

## Dev

Now, run the `dev` script:

```sh
nr dev
```

## Synthesize

After changing the `.projenrc.ts` file, you have to synthesize your project:

```sh
projen
```

## Update

Update dependencies from all packages:

```sh
pnpm up -r
projen
```

Check latest versions of dependencies:

```sh
pnpm up -riL
projen
```
