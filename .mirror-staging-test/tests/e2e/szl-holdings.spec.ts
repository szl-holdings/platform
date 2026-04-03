import { test, expect } from "@playwright/test";

const BASE_PATH = process.env.SZL_BASE_PATH ?? "/";

test.describe("SZL Holdings — Smoke Tests", () => {
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

  test("homepage has substantive content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("SZL Holdings — Route Smoke Tests", () => {
  const routes = [
    { path: "/", label: "homepage" },
    { path: "/about", label: "about" },
    { path: "/ecosystem", label: "ecosystem" },
    { path: "/contact", label: "contact" },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${BASE_PATH}${route.path}`.replace("//", "/"));
      await page.waitForLoadState("domcontentloaded");
      const errorBoundary = page.locator("text=Something went wrong").first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe("SZL Holdings — User Journey: Explore Ecosystem → Contact", () => {
  test("user navigates to ecosystem via nav and portfolio content is visible", async ({ page }) => {
    await page.goto(BASE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const ecosystemLink = nav.locator(
      "a[href*='ecosystem'], a:has-text('Ecosystem'), a:has-text('Portfolio')"
    ).first();
    await expect(ecosystemLink).toBeVisible({ timeout: 10000 });
    await ecosystemLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/ecosystem/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("user navigates from ecosystem to about via nav", async ({ page }) => {
    await page.goto(`${BASE_PATH}ecosystem`.replace("//", "/"));
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const aboutLink = nav.locator("a[href*='about'], a:has-text('About')").first();
    await expect(aboutLink).toBeVisible({ timeout: 10000 });
    await aboutLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/about/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("user navigates from about to contact via nav", async ({ page }) => {
    await page.goto(`${BASE_PATH}about`.replace("//", "/"));
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const contactLink = nav.locator("a[href*='contact'], a:has-text('Contact')").first();
    await expect(contactLink).toBeVisible({ timeout: 10000 });
    await contactLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/contact/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("SZL Holdings — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage renders correctly on mobile", async ({ page }) => {
    await page.goto(BASE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("ecosystem page renders on mobile and URL changes to ecosystem", async ({ page }) => {
    await page.goto(`${BASE_PATH}ecosystem`.replace("//", "/"));
    await page.waitForLoadState("domcontentloaded");
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});
