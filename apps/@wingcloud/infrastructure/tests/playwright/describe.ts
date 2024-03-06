import { exec, execSync } from "node:child_process";

import { test } from "@playwright/test";

export const describe = (callback: () => void) => {
  let server = {
    port: 3900,
    close: () => {},
  };

  test.beforeAll(() => {
    console.log("Starting the server...");

    const serverProcess = exec("npm run dev");
    server.close = () => serverProcess.kill("SIGINT");

    console.log("Waiting for the website resource to be available...");
    execSync(`npx wait-on http://localhost:${server.port}`);
  });

  test.afterAll("Close server", () => {
    console.log("Closing the server...");
    server.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:${server.port}/`);
    await page.click("text=Login with GitHub");
  });

  callback();
};
