# `@wingcloud/vite`

Vite plugin for Wing Cloud. Features:

- Generates type definitions based on the `.env.example` file

## Usage

Add the integration to `vite.config.ts`:

```ts
import wingcloud from "@wingcloud/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [...wingcloud()],
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
