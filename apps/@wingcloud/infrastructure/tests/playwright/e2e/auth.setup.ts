import fs from "node:fs/promises";

import { BrowserContext, test as setup } from "@playwright/test";
import dotenv from "dotenv";

import { AUTH_FILE } from "../../../playwright.config.js";

dotenv.config();

const GITHUB_USER = process.env.TESTS_GITHUB_USER || "";
const GITHUB_PASSWORD = process.env.TESTS_GITHUB_PASS || "";

const url = process.env.TESTS_E2E_WINCLOUD_URL || "";

setup("authenticate", async ({ browser }) => {
  let context: BrowserContext;

  try {
    await fs.access(AUTH_FILE);
    context = await browser.newContext({ storageState: AUTH_FILE });
  } catch {
    context = await browser.newContext();
  }

  const page = await context.newPage();

  console.log("Logging in...");
  await page.goto(url);

  await page.click("text=Sign In");

  await page.waitForLoadState("networkidle");
  if (page.url().includes("github.com/login")) {
    console.log("Logging in with GitHub...");

    // If it's the first time we visit the page, we need to log in
    if (await page.$("#login_field")) {
      await page.fill("#login_field", GITHUB_USER);
      await page.fill("#password", GITHUB_PASSWORD);
      await page.click('input[type="submit"]');
    }

    // If we are already logged in, we may need to authorize the app
    const authorizeButton = await page.$(
      'button[name="authorize"][value="1"][type="submit"]',
    );
    if (authorizeButton) {
      await authorizeButton.click({ force: true });
    }

    await page.waitForURL(new RegExp(`^${url}`), {
      waitUntil: "networkidle",
      timeout: 30_000,
    });

    await page.context().storageState({ path: AUTH_FILE });
  } else {
    console.log("Already logged in");
  }
});
