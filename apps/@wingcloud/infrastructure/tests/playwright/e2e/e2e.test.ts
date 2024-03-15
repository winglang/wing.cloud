import { expect, test } from "@playwright/test";

const GITHUB_USER = process.env.TESTS_GITHUB_USER || "";

const url = process.env.TESTS_E2E_WINCLOUD_URL || "";
const APP_NAME = process.env.TESTS_E2E_APP_NAME || "";
const branch = process.env.TESTS_E2E_PROD_BRANCH || "main";

test("Visit the /add page", async ({ page }) => {
  page.goto(`${url}/add`);
  await page.waitForSelector("text=Connect");
});

test("Create an app and visit the Console", async ({ page }) => {
  const currentUrlDomain = new URL(page.url()).origin;
  page.goto(`${url}/add`);

  // Create a new app
  await page.getByTestId(`connect-repo-${APP_NAME}`).click();

  // Wait for the app to be created
  await page.waitForURL(new RegExp(`^${url}/${GITHUB_USER}/${APP_NAME}`));
  expect(page.getByTestId("environment-status")).toHaveText("Running");

  // Visit the environment page
  await page.getByTestId("environment-details-button").click();
  await page.waitForURL(
    new RegExp(`^${url}/${GITHUB_USER}/${APP_NAME}/environment/${branch}`),
  );

  // Visit the console
  await page.getByTestId("environment-console-button").click();
  await page.waitForURL(
    new RegExp(`^${url}/${GITHUB_USER}/${APP_NAME}/console/${branch}`),
  );
});
