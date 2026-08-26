import { expect, test } from "@playwright/test";

test("loads the dashboard through the shared query provider", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Chào buổi tối, Tai" })).toBeVisible();
  await expect(page.getByText("Tất cả hệ thống đã sẵn sàng")).toBeVisible();
  await expect(page.getByText("team-management-bff")).toBeVisible();
});

test("persists theme and locale choices across reloads", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByRole("button", { name: "Dùng giao diện tối" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Ngôn ngữ" }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Good evening, Tai" })).toBeVisible();

  await page.reload();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { name: "Good evening, Tai" })).toBeVisible();
});

test("keeps the mobile shell within the viewport and opens navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  await page.getByRole("button", { name: "Mở điều hướng" }).click();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeInViewport();
});
