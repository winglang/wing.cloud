# `@wingcloud/type-prefixed-id`

A helper to make a type-safe prefixed types.

## Usage

```ts
import { buildPrefixedTypeId, type TypeOf } from "@wingcloud/type-prefixed-id";

const { createId, idFromString, valueType } = buildPrefixedTypeId("project");

export type ProjectId = TypeOf<typeof valueType>;

export { createId as createProjectId, idFromString as projectIdFromString };
```
