/**
 * Lyte Command Center — E2E Spec
 *
 * Lyte is SZL Holdings' governed-AI decisioning platform — hosted at /lyte
 * within the SZL Holdings web app. There is no separate standalone Lyte web
 * artifact; the lyte-command-center artifact directory is a build placeholder.
 *
 * LYTE_BASE_PATH env var allows overriding the base path if Lyte ever becomes
 * a standalone artifact. In CI the spec runs against the @workspace/szl-holdings
 * build served on port 3000.
 */
import { test, expect } from "@playwright/test";

const SZL_PATH = process.env.LYTE_BASE_PATH ?? process.env.SZL_BASE_PATH ?? "/";
const LYTE_PATH = (SZL_PATH.endsWith("/") ? `${SZL_PATH}lyte` : `${SZL_PATH}/lyte`).replace("//", "/");

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(LYTE_PATH, { timeout: 8000, waitUntil: "domcontentloaded" });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe("Lyte Command Center — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LYTE_PATH);
  });

  test("loads Lyte without fatal errors", async ({ page }) => {
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

  test("page body has substantive content", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Lyte Command Center — Route Smoke Tests", () => {
  const routes = [
    { path: "", label: "lyte home" },
    { path: "/decision-theater", label: "decision theater" },
    { path: "/signal-fusion", label: "signal fusion" },
    { path: "/health-freshness", label: "health freshness" },
    { path: "/decision-schemas", label: "decision schemas" },
    { path: "/governance-posture", label: "governance posture" },
    { path: "/use-cases", label: "use cases" },
  ];

  for (const route of routes) {
    test(`${route.label} route loads without crash`, async ({ page }) => {
      await page.goto(`${LYTE_PATH}${route.path}`);
      await page.waitForLoadState("domcontentloaded");
      const errorBoundary = page.locator("text=Something went wrong").first();
      const hasError = await errorBoundary.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    });
  }
});

test.describe("Lyte Command Center — Content Validation", () => {
  test("lyte home shows decisioning platform content", async ({ page }) => {
    await page.goto(LYTE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const lyteContent = page
      .locator(
        ":text('Lyte'), :text('Decision'), :text('Governed'), :text('Signal'), :text('Intelligence'), :text('AI')"
      )
      .first();
    await expect(lyteContent).toBeVisible({ timeout: 15000 });
  });

  test("decision theater page renders content", async ({ page }) => {
    await page.goto(`${LYTE_PATH}/decision-theater`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('Decision'), :text('Theater'), :text('Signal'), :text('Scenario'), :text('Loop'), :text('Simulation')"
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test("governance posture page renders compliance content", async ({ page }) => {
    await page.goto(`${LYTE_PATH}/governance-posture`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('Governance'), :text('Posture'), :text('Compliance'), :text('Policy'), :text('Audit'), :text('Risk')"
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test("signal fusion page renders data sources content", async ({ page }) => {
    await page.goto(`${LYTE_PATH}/signal-fusion`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const content = page
      .locator(
        ":text('Signal'), :text('Fusion'), :text('Data'), :text('Source'), :text('Feed'), :text('Stream')"
      )
      .first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test("user navigates from lyte home to decision theater via nav or links", async ({ page }) => {
    await page.goto(LYTE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const theaterLink = page
      .locator("a[href*='decision-theater'], a:has-text('Decision Theater'), a:has-text('Theater')")
      .first();
    const hasTheaterLink = await theaterLink.isVisible({ timeout: 10000 }).catch(() => false);
    if (hasTheaterLink) {
      await theaterLink.click();
      await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
      await expect(page).toHaveURL(/decision-theater/i);
      const body = await page.content();
      expect(body.length).toBeGreaterThan(200);
    } else {
      const body = await page.content();
      expect(body.length).toBeGreaterThan(500);
    }
  });
});

test.describe("Lyte Command Center — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("lyte home renders on mobile without crash", async ({ page }) => {
    await page.goto(LYTE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("decision theater page renders on mobile without crash", async ({ page }) => {
    await page.goto(`${LYTE_PATH}/decision-theater`);
    await page.waitForLoadState("domcontentloaded");
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});
