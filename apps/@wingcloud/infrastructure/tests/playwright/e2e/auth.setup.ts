import { expect, test as setup } from "@playwright/test";
import * as OTPAuth from "otpauth";

import { AUTH_FILE } from "../../../playwright.config.js";

const GITHUB_USER = process.env.TESTS_GITHUB_USER;
const GITHUB_PASSWORD = process.env.TESTS_GITHUB_PASS;
const GITHUB_OTP_SECRET = process.env.TESTS_GITHUB_OTP_SECRET;
const WINGCLOUD_URL = process.env.TESTS_E2E_URL;

if (!GITHUB_USER || !GITHUB_PASSWORD || !GITHUB_OTP_SECRET || !WINGCLOUD_URL) {
  throw new Error(
    "Please provide the required environment variables 'TESTS_XXX'",
  );
}

interface OTPProps {
  username: string;
  secret: string;
}

const getGitHubOTP = (props: OTPProps) => {
  // https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication#manually-configuring-a-totp-app
  const totp = new OTPAuth.TOTP({
    issuer: "GitHub",
    label: props.username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: props.secret,
  });
  return totp.generate();
};

export const githubLogin = async ({ page }) => {
  console.log("Logging in...");

  // Fill the login form and submit if needed
  if (await page.$("#login_field")) {
    await page.fill("#login_field", GITHUB_USER);
    await page.fill("#password", GITHUB_PASSWORD);
    await page.click('input[type="submit"]');
    await page.waitForLoadState("networkidle");
  }

  // If we have 2FA enabled, we need to fill the TOTP
  if (page.url().includes("github.com/sessions/two-factor")) {
    // Navigate to the TOTP page
    console.log("Filling OTP...");
    await page.goto("https://github.com/sessions/two-factor/app");
    await page.fill(
      "#app_totp",
      getGitHubOTP({ username: GITHUB_USER, secret: GITHUB_OTP_SECRET }),
    );
    await page.waitForLoadState("networkidle");
  }

  // If we are already logged in, we may need to authorize the app
  if (page.url().includes("github.com/login/oauth/authorize")) {
    const authorizeButton = page.locator(
      'button[name="authorize"][value="1"][type="submit"]',
    );
    if (
      await authorizeButton.isVisible({
        timeout: 5000,
      })
    ) {
      console.log("Authorizing the app...");
      expect(authorizeButton).toBeEnabled({ timeout: 10_000 });
      await authorizeButton.click();
    }
    await page.waitForLoadState("networkidle");
  }

  console.log("Logged in successfully!");

  // Playwright doesn't support 302 redirects on localhost.
  if (WINGCLOUD_URL.includes("localhost")) {
    // check if we left the github domain
    expect(page.url()).not.toMatch(/github.com/);
  } else {
    expect(page.url()).toMatch(WINGCLOUD_URL);
  }
};

setup("authenticate", async ({ page }) => {
  await page.goto(WINGCLOUD_URL);

  await page.click("text=Sign In");

  await page.waitForLoadState("networkidle");

  if (page.url().includes("github.com/login")) {
    await githubLogin({ page });
    await page.context().storageState({ path: AUTH_FILE });
  } else {
    console.log("Already logged in");
  }
});
