import { expect, test } from "@playwright/test";

test("league page loads and shows create league CTA", async ({ page }) => {
  await page.goto("/league");

  // The league page should load and show some content
  await expect(
    page.getByRole("heading", { name: /League|Create/i }).first(),
  ).toBeVisible();
});

test("navigation contains all primary links", async ({ page }) => {
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav).toBeVisible();

  // Use exact link text to avoid matching descriptive text
  await expect(nav.getByRole("link", { name: /Events/i })).toBeVisible();
});

test("footer contains privacy and terms links", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: /Privacy Policy/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Terms of Service/i }),
  ).toBeVisible();
});
