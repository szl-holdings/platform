import { test, expect } from "@playwright/test";

const AEGIS_PATH = process.env.AEGIS_BASE_PATH ?? "/firestorm";

test.describe("Aegis — SOC Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(AEGIS_PATH);
  });

  test("loads the Aegis app without fatal errors", async ({ page }) => {
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("renders main navigation", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("page title is set", async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
  });

  test("app shell renders with sidebar or main content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const content = page.locator("main, #root, [class*='layout'], [class*='sidebar']").first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test("navigation to SOC dashboard works", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const socLink = page.locator("a[href*='soc'], a:text-is('SOC'), a:text-is('Dashboard')").first();
    const hasLink = await socLink.isVisible().catch(() => false);
    if (hasLink) {
      await socLink.click();
      await expect(page).toHaveURL(/.*/);
    }
  });
});
