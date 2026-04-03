import { test, expect } from "@playwright/test";

const LYTE_PATH = process.env.LYTE_BASE_PATH ?? "/lyte-command-center";

test.describe("Lyte Command Center — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LYTE_PATH);
  });

  test("loads Lyte app without fatal errors", async ({ page }) => {
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

  test("navigation or sidebar is present", async ({ page }) => {
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

test.describe("Lyte Command Center — Route Smoke Tests", () => {
  const routes = [
    { path: "", label: "dashboard" },
    { path: "/dashboard", label: "main dashboard" },
    { path: "/ai-ops", label: "ai-ops" },
    { path: "/alerts", label: "alerts" },
    { path: "/action-center", label: "action center" },
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

test.describe("Lyte Command Center — User Journey: View Queue → Triage Alert → Create Action", () => {
  test("user navigates to alerts via nav and alerts page renders with content", async ({ page }) => {
    await page.goto(LYTE_PATH);
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

    await expect(page).toHaveURL(/alert/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("user navigates from alerts to action center via nav", async ({ page }) => {
    await page.goto(`${LYTE_PATH}/alerts`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const actionLink = nav.locator("a[href*='action'], a:has-text('Action')").first();
    await expect(actionLink).toBeVisible({ timeout: 10000 });
    await actionLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    await expect(page).toHaveURL(/action/i);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("user navigates to AI ops via nav and AI ops page renders", async ({ page }) => {
    await page.goto(LYTE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    const aiLink = nav.locator("a[href*='ai-ops'], a[href*='ai_ops'], a:has-text('AI Ops'), a:has-text('AIOps')").first();
    await expect(aiLink).toBeVisible({ timeout: 10000 });
    await aiLink.click();
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("Lyte Command Center — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("dashboard renders correctly on mobile", async ({ page }) => {
    await page.goto(LYTE_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("alerts page renders on mobile with content", async ({ page }) => {
    await page.goto(`${LYTE_PATH}/alerts`);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});
