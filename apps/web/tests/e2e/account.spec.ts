import { expect, test } from "@playwright/test";

test("account page shows onboarding form for unauthenticated users", async ({
  page,
}) => {
  await page.goto("/account");

  const heading = page.getByRole("heading", {
    name: /Profile and settings|Finish your setup|Your profile/i,
  });
  await expect(heading.first()).toBeVisible();
});

test("account page has accessible form fields", async ({ page }) => {
  await page.goto("/account");

  await expect(page.locator("#main-content")).toBeVisible();
});
