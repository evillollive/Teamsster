import { expect, test } from "@playwright/test";

test("privacy policy page loads with correct content", async ({ page }) => {
  await page.goto("/privacy");

  await expect(
    page.getByRole("heading", { name: /Privacy Policy/i, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText(/Information We Collect/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Data Retention/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Your Rights/i),
  ).toBeVisible();
});

test("terms of service page loads with correct content", async ({ page }) => {
  await page.goto("/terms");

  await expect(
    page.getByRole("heading", { name: /Terms of Service/i, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText(/Acceptable Use/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Account Termination/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Open Source/i),
  ).toBeVisible();
});

test("privacy page links back to terms and vice versa", async ({ page }) => {
  await page.goto("/privacy");
  const termsLink = page.getByRole("link", { name: /Terms of Service/i });
  await expect(termsLink.first()).toBeVisible();
});
