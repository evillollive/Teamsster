import { expect, test } from "@playwright/test";

test("home page shows the Teamsster scaffold", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /A playful home base/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /View league shell/i }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toContainText(
    "League",
  );
});
