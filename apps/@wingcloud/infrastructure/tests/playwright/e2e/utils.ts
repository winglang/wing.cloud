import { Page } from "@playwright/test";

export const reloadUntil = async (
  page: Page,
  condition: () => Promise<boolean>,
  options?: {
    timeout?: number;
  },
) => {
  const timeout = options?.timeout ?? 30_000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await page.reload();
    await page.waitForLoadState("networkidle");
  }
  throw new Error("Condition not met");
};
