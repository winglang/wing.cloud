# `@wingcloud/opaque-type`

A type helper to make a opaque types.

## Usage

```ts
import type { OpaqueType } from "@wingcloud/opaque-type";

type AccountId = OpaqueType<number, { readonly t: unique symbol }>;
type PersonId = OpaqueType<number, { readonly t: unique symbol }>;

const createPersonId = () => 1 as PersonId;

// This will fail to compile, as they are fundamentally different types.
const accountId: AccountId = createPersonId();
```
