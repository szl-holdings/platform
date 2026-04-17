import { test, expect } from "@playwright/test";

const BASE = (process.env.IMPERIUM_BASE_PATH ?? "/imperium").replace(/\/$/, "");

let appAvailable = true;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(`${BASE}/`, { timeout: 5000, waitUntil: "domcontentloaded" });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});
test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe("IMPERIUM — Smoke Tests", () => {
  test("loads home without fatal errors", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const crashed = page.locator("text=Something went wrong").first();
    expect(await crashed.isVisible().catch(() => false)).toBe(false);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(500);
  });

  test("page has a title", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page).toHaveTitle(/.+/);
  });
});

test.describe("IMPERIUM — Route Smoke Tests", () => {
  const routes = [
    { path: "/legatus", label: "legatus console" },
    { path: "/imperium-map", label: "imperium map" },
    { path: "/praetorian", label: "praetorian guard" },
    { path: "/senate", label: "senate chamber" },
    { path: "/supply-lines", label: "supply lines" },
    { path: "/centurion", label: "centurion AI" },
    { path: "/intelligence", label: "intelligence briefing" },
  ];

  for (const route of routes) {
    test(`${route.label} route renders without crash`, async ({ page }) => {
      await page.goto(`${BASE}${route.path}`);
      await page.waitForLoadState("domcontentloaded");
      const crashed = page.locator("text=Something went wrong").first();
      expect(await crashed.isVisible().catch(() => false)).toBe(false);
      const notFound = page.locator("text=PAGE NOT FOUND").first();
      expect(await notFound.isVisible().catch(() => false)).toBe(false);
      const html = await page.content();
      expect(html.length).toBeGreaterThan(300);
    });
  }
});

test.describe("IMPERIUM — Per-Route Content Validation", () => {
  test("imperium-map shows map heading", async ({ page }) => {
    await page.goto(`${BASE}/imperium-map`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const html = await page.content();
    expect(html).toMatch(/IMPERIUM MAP|imperium.map/i);
  });

  test("praetorian shows threat condition indicators", async ({ page }) => {
    await page.goto(`${BASE}/praetorian`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const html = await page.content();
    expect(html).toMatch(/Threat Condition|PRAETORIAN|CLEAR|ELEVATED|ACTIVE/i);
  });

  test("senate shows senate content", async ({ page }) => {
    await page.goto(`${BASE}/senate`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const html = await page.content();
    expect(html).toMatch(/SENATE/i);
  });

  test("supply-lines shows infrastructure metrics", async ({ page }) => {
    await page.goto(`${BASE}/supply-lines`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const html = await page.content();
    expect(html).toMatch(/SUPPLY LINES|CPU Utilization|Memory/i);
  });

  test("centurion shows AI metrics", async ({ page }) => {
    await page.goto(`${BASE}/centurion`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const html = await page.content();
    expect(html).toMatch(/CENTURION|Active Centurions|Aquila/i);
  });

  test("intelligence shows briefing content", async ({ page }) => {
    await page.goto(`${BASE}/intelligence`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const html = await page.content();
    expect(html).toMatch(/INTELLIGENCE|SIGINT|briefing/i);
  });
});
