import { test, expect } from "@playwright/test";

const STEPHEN_PATH = process.env.STEPHEN_BASE_PATH ?? "/stephen";

test.describe("Stephen Lutar — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STEPHEN_PATH);
  });

  test("loads Stephen site without fatal errors", async ({ page }) => {
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
    const root = page.locator("#root, main, body").first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });

  test("navigation links are present", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const links = page.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test("page body has substantive content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Stephen Lutar — Route Smoke Tests", () => {
  const routes = [
    { path: "", label: "home" },
    { path: "/about", label: "about" },
    { path: "/contact", label: "contact" },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${STEPHEN_PATH}${route.path}`);
      await page.waitForLoadState("domcontentloaded");
      const errorBoundary = page.locator("text=Something went wrong").first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe("Stephen Lutar — User Journey: Personal Brand Exploration", () => {
  test("user navigates to about via nav link and URL changes to about", async ({ page }) => {
    await page.goto(STEPHEN_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, header").first();
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
    expect(body.length).toBeGreaterThan(200);
  });

  test("user navigates from about to contact via nav and URL changes to contact", async ({ page }) => {
    await page.goto(`${STEPHEN_PATH}/about`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, header").first();
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
    expect(body.length).toBeGreaterThan(200);
  });
});

test.describe("Stephen Lutar — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage renders correctly on mobile", async ({ page }) => {
    await page.goto(STEPHEN_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("about page renders on mobile and URL is correct", async ({ page }) => {
    await page.goto(`${STEPHEN_PATH}/about`);
    await page.waitForLoadState("domcontentloaded");
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});
