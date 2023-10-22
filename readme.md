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

Complete the missing `.env` variables. You'll need a [GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app).

Also, remove any commented lines from the `.env` file. It won't be necessary after [#4595](https://github.com/winglang/wing/issues/4595) is completed.

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
