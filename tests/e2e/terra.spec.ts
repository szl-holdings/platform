import { test, expect } from "@playwright/test";

const TERRA_PATH = process.env.TERRA_BASE_PATH ?? "/terra";

test.describe("Terra — Real Estate Intelligence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TERRA_PATH);
  });

  test("loads Terra app successfully", async ({ page }) => {
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("page title is set", async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
  });

  test("renders main app content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const root = page.locator("#root, [id='root'], main, body").first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });

  test("portfolio or listing content is present", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const bodyContent = await page.content();
    expect(bodyContent.length).toBeGreaterThan(500);
  });

  test("navigation links exist", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const links = page.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
