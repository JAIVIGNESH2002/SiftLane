import { expect, test } from "@playwright/test";

test("empty reader shell is usable", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /follow many feeds/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /add feed/i })).toBeVisible();
  await expect(page.getByPlaceholder("Search titles and descriptions")).toBeVisible();
});
