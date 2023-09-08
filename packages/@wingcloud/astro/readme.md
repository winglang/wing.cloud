# `@wingcloud/astro`

Integration for Astro that creates uses Docker to create a local DynamoDB instance. Provides a virtual module that can be used to interact with it.

## Usage

`astro.config.mjs`:

```ts
import { dynamodb } from "@wingcloud/astro";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [dynamodb()],
});
```

`src/pages/index.astro`:

```markdown
---
import { client, TableName } from "virtual:@wingcloud/astro";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";

await client.send(
  new PutItemCommand({
    TableName,
    Item: {
      pk: { S: "user_1" },
      sk: { S: "#" },
      name: { S: "John" },
    },
  }),
);
---

<html>
  <body>
    <h1>Hello world!</h1>
  </body>
</html>
```
