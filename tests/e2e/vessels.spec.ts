import { test, expect } from "@playwright/test";

const VESSELS_PATH = process.env.VESSELS_BASE_PATH ?? "/vessels";

test.describe("Vessels — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VESSELS_PATH);
  });

  test("loads Vessels app without fatal errors", async ({ page }) => {
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

  test("navigation is present", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("page body has substantive content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Vessels — Route Smoke Tests", () => {
  const routes = [
    { path: "", label: "home" },
    { path: "/fleet-dashboard", label: "fleet dashboard" },
    { path: "/fleet-map", label: "fleet map" },
    { path: "/exceptions-center", label: "exceptions center" },
    { path: "/alert-center", label: "alert center" },
    { path: "/command-overview", label: "command overview" },
    { path: "/document-engine", label: "document engine" },
    { path: "/simulations-page", label: "simulations" },
    { path: "/disruption-forecast", label: "disruption forecast" },
    { path: "/command-mode", label: "command mode" },
    { path: "/voyage-desk", label: "voyage desk" },
    { path: "/dark-vessel-detection", label: "dark vessel detection" },
    { path: "/autonomous-routing", label: "autonomous routing" },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${VESSELS_PATH}${route.path}`);
      await page.waitForLoadState("domcontentloaded");
      const errorBoundary = page.locator("text=Something went wrong").first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe("Vessels — User Journey: View Fleet → Open Exception → Review Alert", () => {
  test("user navigates to fleet dashboard via nav and Fleet Command KPI is visible", async ({ page }) => {
    await page.goto(VESSELS_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const fleetLink = nav.locator(
      "a[href*='fleet'], a:has-text('Fleet'), a:has-text('Dashboard')"
    ).first();
    await expect(fleetLink).toBeVisible({ timeout: 10000 });
    await fleetLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const fleetKPI = page.locator(
      ":text('Fleet Command'), :text('FLEET'), :text('Active Fleet'), :text('SEA'), :text('PORT')"
    ).first();
    await expect(fleetKPI).toBeVisible({ timeout: 15000 });
  });

  test("user navigates from fleet dashboard to exceptions center via nav", async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/fleet-dashboard`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const exceptionsLink = nav.locator(
      "a[href*='exception'], a:has-text('Exception')"
    ).first();
    await expect(exceptionsLink).toBeVisible({ timeout: 10000 });
    await exceptionsLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/exception/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("user navigates from exceptions to alert center via nav", async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/exceptions-center`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const alertLink = nav.locator(
      "a[href*='alert'], a:has-text('Alert')"
    ).first();
    await expect(alertLink).toBeVisible({ timeout: 10000 });
    await alertLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Vessels — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("home renders on mobile without crash", async ({ page }) => {
    await page.goto(VESSELS_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("fleet dashboard renders on mobile with Fleet Command content", async ({ page }) => {
    await page.goto(`${VESSELS_PATH}/fleet-dashboard`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const fleetKPI = page.locator(
      ":text('Fleet Command'), :text('FLEET'), :text('SEA'), :text('PORT')"
    ).first();
    await expect(fleetKPI).toBeVisible({ timeout: 15000 });
  });
});
