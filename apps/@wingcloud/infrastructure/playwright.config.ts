import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

export const AUTH_FILE = "apps/@wingcloud/.playwright/user.json";

// load environment variables from .env file
dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */

export default defineConfig({
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { open: "never" }]],
  timeout: 60_000 * 2,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    ignoreHTTPSErrors: true,
  },

  outputDir: "../.playwright/test-results",

  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      testMatch: /.*\.test\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
      },
      dependencies: ["setup"],
    },
  ],
});
