import { Page, expect, test } from "@playwright/test";

const GITHUB_USER = process.env.TESTS_GITHUB_USER || "";

const url = process.env.TESTS_E2E_URL || "";
const appName = process.env.TESTS_E2E_APP_NAME || "";
const branch = process.env.TESTS_E2E_PROD_BRANCH || "main";

const deleteApp = async (page: Page, appName: string) => {
  console.log("Deleting the app...");
  page.goto(`${url}/${GITHUB_USER}/${appName}/settings`);
  const deleteButton = page.getByTestId("delete-app-button");
  await expect(deleteButton).toBeEnabled({
    timeout: 30_000,
  });
  deleteButton.click();

  console.log("Confirming the delete modal...");
  page.getByTestId("modal-confirm-button").click();
};

test("Create an app and visit the Console", async ({ page }) => {
  page.goto(`${url}/add`);

  // Create a new app
  console.log("Creating a new app...");
  const connectAppButton = page.getByTestId(`connect-${appName}-button`);
  await expect(connectAppButton).toBeEnabled({
    timeout: 30_000,
  });
  await connectAppButton.click();

  // Wait for the app to be created
  console.log("Waiting for the app to be created...");
  await page.waitForURL(new RegExp(`^${url}/${GITHUB_USER}/${appName}`));

  // Visit the environment page
  console.log("Visiting the environment page...");
  await page.getByTestId("environment-details-button").click();

  await page.waitForURL(
    new RegExp(`^${url}/${GITHUB_USER}/${appName}/environment/${branch}`),
  );

  // Visit the console
  console.log("Visiting the console...");
  const consoleButton = page.getByTestId("environment-console-button");
  await expect(consoleButton).toBeEnabled({
    timeout: 60_000 * 2,
  });
  await page.getByTestId("environment-console-button").click();
  await page.waitForURL(
    new RegExp(`^${url}/${GITHUB_USER}/${appName}/console/${branch}`),
  );
  expect(page.getByTestId("map-view")).toBeVisible();

  // Delete the app
  await deleteApp(page, appName);

  // Wait for the app to be deleted and the user to be redirected to the add page
  console.log("Waiting for the app to be deleted...");
  await page.waitForURL(new RegExp(`^${url}/add`));

  console.log("App deleted successfully");
});

test.afterEach("Test teardown", async ({ page }) => {
  await page.goto(`${url}/${GITHUB_USER}/${appName}/settings`);
  await page.waitForLoadState("networkidle");
  if (await page.locator("text=404").isHidden()) {
    console.log("App was not deleted during the test, trying to delete it...");
    await deleteApp(page, appName);
  }
});
