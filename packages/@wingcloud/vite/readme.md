# `@wingcloud/vite`

Vite package for Wing.

## Usage

```
being "@wingcloud/vite" as vite;

let website = new vite.Vite(
  root: "../website",
);
```

Configure TypeScript to use the generated types in your `website` project:

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
