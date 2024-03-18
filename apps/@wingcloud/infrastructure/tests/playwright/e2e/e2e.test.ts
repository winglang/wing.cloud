import { Page, expect, test } from "@playwright/test";

const GITHUB_USER = process.env.TESTS_GITHUB_USER || "";
const WINGCLOUD_URL = process.env.TESTS_E2E_URL || "";
const APP_NAME = process.env.TESTS_E2E_APP_NAME || "";
const PROD_BRANCH = process.env.TESTS_E2E_PROD_BRANCH || "";

const deleteApp = async (page: Page, appName: string) => {
  console.log("Deleting the app...");
  page.goto(`${WINGCLOUD_URL}/${GITHUB_USER}/${appName}/settings`);
  const deleteButton = page.getByTestId("delete-app-button");
  await expect(deleteButton).toBeEnabled({
    timeout: 30_000,
  });
  deleteButton.click();

  console.log("Confirming the delete modal...");
  page.getByTestId("modal-confirm-button").click();
};

test("Create an app and visit the Console", async ({ page }) => {
  if (!GITHUB_USER || !WINGCLOUD_URL || !APP_NAME || !PROD_BRANCH) {
    throw new Error(
      "Please provide the required environment variables 'TESTS_XXX'",
    );
  }

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
  await page.getByTestId("environment-details-button").click();

  await page.waitForURL(
    new RegExp(
      `^${WINGCLOUD_URL}/${GITHUB_USER}/${APP_NAME}/environment/${PROD_BRANCH}`,
    ),
  );

  // Visit the console
  console.log("Waiting for the console button to be enabled...");
  const consoleButton = page.getByTestId("environment-console-button");
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

test.afterEach("Test teardown", async ({ page }) => {
  await page.goto(`${WINGCLOUD_URL}/${GITHUB_USER}/${APP_NAME}/settings`);
  await page.waitForLoadState("networkidle");
  if (await page.locator("text=404").isHidden()) {
    console.log("App was not deleted during the test, trying to delete it...");
    await deleteApp(page, APP_NAME);
  }
});
