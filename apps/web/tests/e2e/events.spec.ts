import { expect, test } from "@playwright/test";

test("events page requires auth for management actions", async ({ page }) => {
  await page.goto("/events");

  await expect(
    page.getByRole("heading", { name: /Scheduling workspace/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/Sign in and open a league team to create games/i),
  ).toBeVisible();
  await expect(page.getByText(/Download calendar \(\.ics\)/i)).toHaveCount(0);
});

test("home navigation links to events workspace", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: /Events/i })
    .click();
  await expect(page).toHaveURL(/\/events$/);
});
