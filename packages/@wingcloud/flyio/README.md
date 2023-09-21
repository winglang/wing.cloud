## `@wingcloud/flyio`

This JSII library provides interface to control fly.io apps and machines. 

## How to use

#### Create a new app with one machine

```ts
// by default this will try to get the token from the `FLY_API_TOKEN` env var.
const fly = new Fly(new FlyClient());
const app = fly.app("my-app");
await app.create();
await app.createMachine(...);
```

#### Replace the exisiting machine with a new machine

```ts
const app = fly.app("my-app");
await app.update(...);
```
