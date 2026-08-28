import { expect, test } from "@playwright/test";

test("redirects anonymous visitors from the dashboard to sign in", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("team-management-locale", "en"));
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?returnTo=\/dashboard/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("persists theme and locale choices across reloads", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => window.localStorage.setItem("team-management-locale", "en"));
  await page.reload();

  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Language" }).click();
  await page.getByRole("menuitemradio", { name: "Tiếng Việt" }).click();
  await expect(page.getByRole("heading", { name: "Chào mừng bạn quay lại" })).toBeVisible();

  await page.reload();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { name: "Chào mừng bạn quay lại" })).toBeVisible();
});

test("keeps the registration screen within the mobile viewport", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("team-management-locale", "en"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("heading", { name: "Create your work account" })).toBeInViewport();
});

test("validates sign-in fields before sending an API request", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("team-management-locale", "en"));
  let signInRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/auth/sign-in")) signInRequests += 1;
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("This field is required.")).toHaveCount(2);
  expect(signInRequests).toBe(0);
});
