## flyiolib

This JSII library provides interface to control fly.io apps and machines. 

## How to use

```ts
// by default this will try to get the token from the `FLY_API_TOKEN` env var.
const fly = new Fly(new FlyClient());
const app = fly.app("my-app");
await app.create();
await app.createMachine(...);
```
