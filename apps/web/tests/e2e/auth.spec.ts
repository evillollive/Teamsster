import { expect, test } from "@playwright/test";

test.describe("authentication", () => {
  test("homepage loads and shows sign-in link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("sign-in page renders with heading and method tabs", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await expect(
      page.getByRole("heading", { name: /sign in to teamsster/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tablist", { name: /sign-in method/i }),
    ).toBeVisible();
  });

  test("sign-in page has email and username tabs", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("tab", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /username/i })).toBeVisible();
  });
});
