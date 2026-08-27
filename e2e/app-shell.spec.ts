import { expect, test } from "@playwright/test";

test("redirects anonymous visitors from the dashboard to sign in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?returnTo=\/dashboard/);
  await expect(page.getByRole("heading", { name: "Chao mung ban quay lai" })).toBeVisible();
});

test("persists theme and locale choices across reloads", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: /giao/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: /Ng/ }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  await page.reload();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("keeps the registration screen within the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("heading", { name: "Tao tai khoan cong ty" })).toBeInViewport();
});
