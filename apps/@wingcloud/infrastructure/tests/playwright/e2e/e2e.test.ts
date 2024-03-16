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
  page.goto(`${url}/add`);

  // // Create a new app
  await page.getByTestId(`connect-${APP_NAME}-button`).click();

  // Wait for the app to be created
  await page.waitForURL(new RegExp(`^${url}/${GITHUB_USER}/${APP_NAME}`));

  // Visit the environment page
  await page.getByTestId("environment-details-button").click();

  await page.waitForURL(
    new RegExp(`^${url}/${GITHUB_USER}/${APP_NAME}/environment/${branch}`),
  );

  //expect(page.getByTestId("environment-status")).toHaveText("running");

  // Visit the console
  const consoleButton = page.getByTestId("environment-console-button");
  await expect(consoleButton).toBeEnabled({
    timeout: 60_000,
  });
  await page.getByTestId("environment-console-button").click();
  await page.waitForURL(
    new RegExp(`^${url}/${GITHUB_USER}/${APP_NAME}/console/${branch}`),
  );

  // Check that the console is visible
  expect(page.getByTestId("map-view")).toBeVisible();

  // Delete the app
  page.goto(`${url}/${GITHUB_USER}/${APP_NAME}/settings`);
  // const deleteButton = await page.getByTestId("delete-app-button");
  const deleteButton = await page.waitForSelector("button:has-text('Delete')");
  await page.waitForFunction(
    (selector) => document?.querySelector(selector)?.disabled === false,
    deleteButton,
    { timeout: 60_000 }, // Adjust timeout as needed
  );
  deleteButton.click();

  // page.getByTestId("modal-confirm-button").click();
  const confirmButton = await page.waitForSelector(
    "button:has-text('Confirm')",
  );
  confirmButton.click();

  // Wait for the app to be deleted and the user to be redirected to the add page
  await page.waitForURL(new RegExp(`^${url}/add`));
});
