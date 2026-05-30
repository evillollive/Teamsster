import { expect, test } from "@playwright/test";

test.describe("roster management", () => {
  test("roster page returns valid response", async ({ page }) => {
    // Without auth, roster pages return 404 (notFound) which is expected
    const response = await page.goto(
      "/league/00000000-0000-0000-0000-000000000001/team/00000000-0000-0000-0000-000000000002/roster",
    );
    // 404 is expected (no auth/data), just verifying no 500
    expect(response?.status()).not.toBe(500);
  });
});

test.describe("notification center", () => {
  test("notifications page loads without server error", async ({ page }) => {
    const response = await page.goto("/notifications");
    expect(response?.status()).not.toBe(500);
  });

  test("notifications page shows sign-in prompt for guests", async ({
    page,
  }) => {
    await page.goto("/notifications");
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });
});
