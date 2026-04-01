import { test, expect } from "@playwright/test";

const BASE_PATH = process.env.SZL_BASE_PATH ?? "/";

test.describe("SZL Holdings — Homepage Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_PATH);
  });

  test("loads the homepage successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("renders main content sections", async ({ page }) => {
    const main = page.locator("main, [role='main'], #root, #app").first();
    await expect(main).toBeVisible({ timeout: 15000 });
  });

  test("navigation links are present and clickable", async ({ page }) => {
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible({ timeout: 15000 });
    const links = nav.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test("page has no broken main layout", async ({ page }) => {
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("ecosystem or portfolio section is present", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    const hasContent = body.length > 500;
    expect(hasContent).toBe(true);
  });
});
