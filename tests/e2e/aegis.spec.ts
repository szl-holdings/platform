import { test, expect } from "@playwright/test";

const AEGIS_PATH = process.env.AEGIS_BASE_PATH ?? "/firestorm";

test.describe("Aegis — Smoke Tests", () => {
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

  test("page body has substantive content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Aegis — Route Smoke Tests", () => {
  const routes = [
    { path: "", label: "home" },
    { path: "/incidents", label: "incidents" },
    { path: "/alerts", label: "alerts" },
    { path: "/cases", label: "cases" },
    { path: "/findings", label: "findings" },
    { path: "/executive-risk", label: "executive risk" },
    { path: "/asset-inventory", label: "asset inventory" },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${AEGIS_PATH}${route.path}`);
      await page.waitForLoadState("domcontentloaded");
      const errorBoundary = page.locator("text=Something went wrong").first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe("Aegis — User Journey: View Queue → Open Incident → Navigate to Findings", () => {
  test("user opens incidents page and Incident Response heading is visible", async ({ page }) => {
    await page.goto(AEGIS_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const incidentsLink = nav.locator("a[href*='incident'], a:has-text('Incident')").first();
    await expect(incidentsLink).toBeVisible({ timeout: 10000 });
    await incidentsLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const heading = page.locator("h1, h2").filter({ hasText: /incident/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("incidents page shows triage status columns or incident cards", async ({ page }) => {
    await page.goto(`${AEGIS_PATH}/incidents`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const statusEl = page.locator(
      ":text('Active'), :text('Critical'), :text('Investigating'), :text('Triage'), :text('New Incident')"
    ).first();
    await expect(statusEl).toBeVisible({ timeout: 15000 });
  });

  test("user navigates from incidents to findings via nav and findings renders", async ({ page }) => {
    await page.goto(`${AEGIS_PATH}/incidents`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const findingsLink = nav.locator("a[href*='finding'], a:has-text('Finding')").first();
    await expect(findingsLink).toBeVisible({ timeout: 10000 });
    await findingsLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/finding/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("alert center shows alert or warning content via nav click", async ({ page }) => {
    await page.goto(`${AEGIS_PATH}/incidents`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const alertsLink = nav.locator("a[href*='alert'], a:has-text('Alert')").first();
    await expect(alertsLink).toBeVisible({ timeout: 10000 });
    await alertsLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Aegis — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("SOC home renders on mobile without crash", async ({ page }) => {
    await page.goto(AEGIS_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("incidents page renders on mobile with Incident Response content", async ({ page }) => {
    await page.goto(`${AEGIS_PATH}/incidents`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const heading = page.locator("h1, h2").filter({ hasText: /incident/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });
});
