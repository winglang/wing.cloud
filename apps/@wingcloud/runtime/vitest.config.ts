import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 90_000,
    setupFiles: ["./test/setup.ts"],
    watch: false,
  },
});
