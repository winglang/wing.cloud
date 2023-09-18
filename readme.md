# `@wingcloud/monorepo`

> [!NOTE]
> We recommend installing these dependencies globally:
>
> - [@antfu/ni](https://github.com/antfu/ni): `pnpm install @antfu/ni --global`
> - [projen](https://github.com/projen/projen): `pnpm install projen --global`
> - [turbo](https://github.com/vercel/turbo): `pnpm install turbo --global`

## Install

```sh
ni
```

## Synthesize

```sh
projen
```

## Dev

Copy the .env.example files as .env for the api and website packages:

```sh
cp apps/@wingcloud/api/.env.example apps/@wingcloud/api/.env

cp apps/@wingcloud/website/.env.example apps/@wingcloud/website/.env
```

Run the website:

```sh
cd apps/@wingcloud/website
nr dev
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
