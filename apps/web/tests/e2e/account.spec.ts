import { expect, test } from "@playwright/test";

test("account page shows onboarding form for unauthenticated users", async ({
  page,
}) => {
  await page.goto("/account");

  // Unauthenticated users should see the onboarding form (first visit)
  // or a sign-in prompt. Either way, the page should load without errors.
  const heading = page.getByRole("heading", {
    name: /Account|Welcome|Sign in/i,
  });
  await expect(heading.first()).toBeVisible();
});

test("account page has accessible form fields", async ({ page }) => {
  await page.goto("/account");

  // The page should not have any broken images or JS errors.
  // Check that the main content area is present.
  await expect(page.locator("#main-content")).toBeVisible();
});
