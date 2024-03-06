import test, { expect } from "@playwright/test";

import { describe } from "./describe.js";

describe(() => {
  test("should display the app name", async ({ page }) => {
    expect(await page.title()).toBe("Sign in to GitHub · GitHub");
  });
});
