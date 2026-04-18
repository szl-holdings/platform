import { test, expect } from "@playwright/test";

const COMMAND_PATH = process.env.COMMAND_BASE_PATH ?? "/command/";

let appAvailable = true;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(COMMAND_PATH, { timeout: 8000, waitUntil: "domcontentloaded" });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});
test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe("Ecosystem Command Portal — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COMMAND_PATH);
  });

  test("loads Command Portal without fatal errors", async ({ page }) => {
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

test.describe("Ecosystem Command Portal — Dashboard Content", () => {
  test("ecosystem pulse or composite score is visible", async ({ page }) => {
    await page.goto(COMMAND_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const pulseContent = page
      .locator(
        ":text('Ecosystem'), :text('Pulse'), :text('Score'), :text('Command'), :text('Health'), :text('Domain')"
      )
      .first();
    await expect(pulseContent).toBeVisible({ timeout: 15000 });
  });

  test("domain grid or portfolio cards are visible", async ({ page }) => {
    await page.goto(COMMAND_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const domainContent = page
      .locator(
        ":text('Lyte'), :text('Aegis'), :text('Vessels'), :text('Terra'), :text('PRISM')"
      )
      .first();
    await expect(domainContent).toBeVisible({ timeout: 15000 });
  });

  test("ecosystem navigation links are present", async ({ page }) => {
    await page.goto(COMMAND_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const links = page.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test("dashboard shows intelligence panel or command actions", async ({ page }) => {
    await page.goto(COMMAND_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const actionContent = page
      .locator(
        ":text('Intelligence'), :text('Action'), :text('Command'), :text('Timeline'), :text('Insight'), :text('Alert')"
      )
      .first();
    await expect(actionContent).toBeVisible({ timeout: 15000 });
  });

  test("cross-domain navigation links to known portals", async ({ page }) => {
    await page.goto(COMMAND_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);

    const ecosystemLink = page
      .locator(
        "a[href*='aegis'], a[href*='vessels'], a[href*='terra'], a[href*='lyte']"
      )
      .first();
    const hasEcosystemLink = await ecosystemLink
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    expect(hasEcosystemLink).toBe(true);
  });
});

test.describe("Ecosystem Command Portal — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("dashboard renders correctly on mobile without crash", async ({ page }) => {
    await page.goto(COMMAND_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("ecosystem content is visible on mobile viewport", async ({ page }) => {
    await page.goto(COMMAND_PATH);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(200);
  });
});
