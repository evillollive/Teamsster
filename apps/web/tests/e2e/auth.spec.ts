import { expect, test } from "@playwright/test";

test.describe("authentication", () => {
  test("shows sign-in page for unauthenticated users", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("sign-in form has accessible labels", async ({ page }) => {
    await page.goto("/sign-in");
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("sign-in form shows validation errors for empty submission", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Native validation should prevent submission or show error state
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeFocused();
  });
});
