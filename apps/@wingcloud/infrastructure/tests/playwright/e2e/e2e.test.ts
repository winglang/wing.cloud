import { Page, expect, test } from "@playwright/test";

import { reloadUntil } from "./utils.js";

const GITHUB_USER = process.env.TESTS_GITHUB_USER;
const WINGCLOUD_URL = process.env.TESTS_E2E_URL;
const APP_NAME = process.env.TESTS_E2E_APP_NAME;
const PROD_BRANCH = process.env.TESTS_E2E_PROD_BRANCH;

if (!GITHUB_USER || !WINGCLOUD_URL || !APP_NAME || !PROD_BRANCH) {
  throw new Error(
    "Please provide the following environment variables: TESTS_GITHUB_USER, TESTS_E2E_URL, TESTS_E2E_APP_NAME, TESTS_E2E_PROD_BRANCH",
  );
}

const deleteApp = async (page: Page, appName: string) => {
  console.log("Deleting the app...");
  const url = `${WINGCLOUD_URL}/${GITHUB_USER}/${appName}/settings`;
  if (page.url() !== url) {
    await page.goto(url);
  }
  const deleteButton = page.getByTestId("delete-app-button");
  await expect(deleteButton).toBeEnabled({
    timeout: 30_000,
  });
  await deleteButton.click();

  console.log("Confirming the delete modal...");
  await page.getByTestId("modal-confirm-button").click();
};

test.beforeEach("Remove the app if needed", async ({ page }) => {
  await page.goto(`${WINGCLOUD_URL}/${GITHUB_USER}/${APP_NAME}/settings`);
  await page.waitForLoadState("networkidle");
  if (await page.locator("text=404").isHidden()) {
    console.log("App, already exists, deleting it...");
    await deleteApp(page, APP_NAME);
  } else {
    console.log("App does not exist, continuing...");
  }
});

test("Create an app and visit the Console", async ({ page }) => {
  page.goto(`${WINGCLOUD_URL}/add`);

  // Create a new app
  console.log("\nTest: Create an app and visit the Console...");
  const connectAppButton = page.getByTestId(`connect-${APP_NAME}-button`);
  await expect(connectAppButton).toBeEnabled({
    timeout: 30_000,
  });
  await connectAppButton.click();

  // Wait for the app to be created
  console.log("Waiting for the app to be created...");
  await page.waitForURL(
    new RegExp(`^${WINGCLOUD_URL}/${GITHUB_USER}/${APP_NAME}`),
  );

  // Visit the environment page
  console.log("Visiting the environment page...");

  // Reload the page to avoid ws connection issues on localhost
  if (WINGCLOUD_URL.includes("localhost")) {
    await reloadUntil(
      page,
      async () => await page.getByTestId("app-details-link").isVisible(),
    );
  }

  await page.getByTestId("app-details-link").click();

  await page.waitForURL(
    new RegExp(
      `^${WINGCLOUD_URL}/${GITHUB_USER}/${APP_NAME}/environment/${PROD_BRANCH}`,
    ),
  );

  // Visit the console
  console.log("Waiting for the console button to be enabled...");

  const consoleButton = page.getByTestId("environment-console-button");

  // Reload the page to avoid ws connection issues on localhost
  if (WINGCLOUD_URL.includes("localhost")) {
    await reloadUntil(page, async () => await consoleButton.isEnabled(), {
      timeout: 60_000 * 2,
    });
  }

  await expect(consoleButton).toBeEnabled({
    timeout: 60_000 * 2,
  });
  console.log("Visiting the console...");
  await page.getByTestId("environment-console-button").click();
  await page.waitForURL(
    new RegExp(
      `^${WINGCLOUD_URL}/${GITHUB_USER}/${APP_NAME}/console/${PROD_BRANCH}`,
    ),
  );
  expect(page.getByTestId("map-view")).toBeVisible();

  // Delete the app
  await deleteApp(page, APP_NAME);

  // Wait for the app to be deleted and the user to be redirected to the add page
  console.log("Waiting for the app to be deleted...");
  await page.waitForURL(new RegExp(`^${WINGCLOUD_URL}/add`));

  console.log("App deleted successfully");
});
