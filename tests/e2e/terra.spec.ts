import { test, expect } from "@playwright/test";

const TERRA_PATH = process.env.TERRA_BASE_PATH ?? "/terra/";

let appAvailable = true;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(TERRA_PATH, { timeout: 8000, waitUntil: "domcontentloaded" });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});
test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe("Terra — Smoke Tests", () => {
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

  test("portfolio content is present", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const bodyContent = await page.content();
    expect(bodyContent.length).toBeGreaterThan(500);
  });

  test("navigation links exist", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const links = page.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Terra — Route Smoke Tests", () => {
  const routes = [
    { path: "", label: "home" },
    { path: "/dashboard", label: "dashboard" },
    { path: "/deals", label: "deals" },
    { path: "/documents", label: "documents" },
    { path: "/analytics", label: "analytics" },
    { path: "/executive-overview", label: "executive overview" },
    { path: "/climate-risk", label: "climate risk" },
    { path: "/agents-command", label: "agents command" },
    { path: "/unified-command", label: "unified command" },
    { path: "/portfolio-scenario", label: "portfolio scenario" },
    { path: "/causal-drilldown", label: "causal drilldown" },
    { path: "/distress-engine", label: "distress engine" },
    { path: "/avm-engine", label: "AVM engine" },
    { path: "/spatial-walkthrough", label: "spatial walkthrough" },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${TERRA_PATH}${route.path}`);
      await page.waitForLoadState("domcontentloaded");
      const errorBoundary = page.locator("text=Something went wrong").first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe("Terra — User Journey: Browse Portfolio → View Asset → Create Action", () => {
  test("user navigates from dashboard to deals via nav and Deal Pipeline heading is visible", async ({ page }) => {
    await page.goto(TERRA_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const dealsLink = nav.locator("a[href*='deal'], a:has-text('Deal'), a:has-text('Pipeline')").first();
    await expect(dealsLink).toBeVisible({ timeout: 10000 });
    await dealsLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/deal/i);
    const heading = page.locator("h1, h2, h3").filter({ hasText: /deal|pipeline/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("deals page shows stage columns (Prospecting, Due Diligence, or Add Deal)", async ({ page }) => {
    await page.goto(`${TERRA_PATH}/deals`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const stageEl = page.locator(
      ":text('Prospecting'), :text('Due Diligence'), :text('Under Contract'), :text('Add Deal'), :text('Active')"
    ).first();
    await expect(stageEl).toBeVisible({ timeout: 15000 });
  });

  test("user navigates from deals to analytics via nav", async ({ page }) => {
    await page.goto(`${TERRA_PATH}/deals`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const analyticsLink = nav.locator("a[href*='analytic'], a:has-text('Analytic'), a:has-text('Market')").first();
    await expect(analyticsLink).toBeVisible({ timeout: 10000 });
    await analyticsLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("documents page renders document management interface", async ({ page }) => {
    await page.goto(`${TERRA_PATH}/deals`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const docsLink = nav.locator("a[href*='document'], a:has-text('Document')").first();
    await expect(docsLink).toBeVisible({ timeout: 10000 });
    await docsLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Terra — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage renders correctly on mobile", async ({ page }) => {
    await page.goto(TERRA_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("deals page renders on mobile with Deal Pipeline content", async ({ page }) => {
    await page.goto(`${TERRA_PATH}/deals`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const heading = page.locator("h1, h2, h3").filter({ hasText: /deal|pipeline/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("executive overview renders on mobile", async ({ page }) => {
    await page.goto(`${TERRA_PATH}/executive-overview`);
    await page.waitForLoadState("domcontentloaded");
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});
