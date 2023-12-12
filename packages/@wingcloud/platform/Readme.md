# Wing Cloud Platform

This is a [custom Wing platform](https://www.winglang.io/docs/concepts/platforms#custom-platforms) for the AWS infrastructure of Wing Cloud.

It comes with 2 predefined environments:

- `test`
- `production`

## Usage

```
npm install @wingcloud/platform
```

The environment can be set via `WING_ENV` and defaults to `production`.

```
export WING_ENV=test
wing compile -t @wingcloud/platform main.w
```

## Test Environment

The overall goal for this environment is to provide an environment which can
be easily created and destroyed without leaving resources behind.

- in contrast to the default implementation, it'll compile a single application for all tests to be shared
- s3 buckets are ephemeral

