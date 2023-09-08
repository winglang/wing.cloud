# `@wingcloud/astro`

Astro integration for Wing Cloud. Features:

- Creates a DynamoDB table for development, and provides a virtual module to interact with it
- Generates type definitions based on the `.env.example` file

## Usage

Add the integration to `astro.config.mjs`:

```ts
import wingcloud from "@wingcloud/astro";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [wingcloud()],
});
```

Configure TypeScript to use the generated types:

```json
{
  "compilerOptions": {
    "include": [".wingcloud/**/*"]
  }
}
```

Optionally, ignore the generated types in `.gitignore`:

```
/.wingcloud/
```

Use the DynamoDB table. See the following example in `src/pages/index.astro`:

```html
---
import { dynamodb, TableName } from "virtual:@wingcloud/astro/dynamodb";

await client.putItem({
  TableName,
  Item: {
    pk: { S: "user_1" },
    sk: { S: "#" },
    name: { S: "John" },
  },
});
---

<html>
  <body>
    <h1>Hello world!</h1>
  </body>
</html>
```
