import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/entrypoint-flyio.ts", "src/entrypoint-local.ts"],
  external: ["@wingconsole/app"],
  format: ["cjs"],
  clean: true
});
