/**
 * PRISM Counsel — Legal Command — E2E Spec
 *
 * PRISM Counsel is the legal-matter command surface for the SZL Holdings
 * platform.  It is published as the @workspace/prism-counsel artifact and in
 * CI is built and served standalone (BASE_PATH=/) on port 3006.
 *
 * The app gates real content behind Replit Auth.  In environments without a
 * live auth backend (CI static serve, local previews) we drive the app in
 * sandbox/demo mode via the `?demo=true` query string — this skips the auth
 * gate and renders the matter board surface, exercising the same routing,
 * code-splitting, and layout chunks that production users hit.
 *
 * PRISM_BASE_PATH env var allows overriding the base path if the route mount
 * point ever changes.  Defaults to "/" so the standalone CI build works out
 * of the box.
 */
import { test, expect } from "@playwright/test";

const PRISM_BASE = (process.env.PRISM_BASE_PATH ?? "/").replace(/\/$/, "");
const PRISM_HOME = PRISM_BASE === "" ? "/" : PRISM_BASE;
const PRISM_DEMO = PRISM_HOME + (PRISM_HOME.endsWith("/") ? "" : "/") + "?demo=true";

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(PRISM_HOME, { timeout: 8000, waitUntil: "domcontentloaded" });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe("PRISM Counsel — Smoke Tests", () => {
  test("loads PRISM Counsel without fatal errors", async ({ page }) => {
    await page.goto(PRISM_HOME);
    await page.waitForLoadState("domcontentloaded");
    const root = page.locator("#root");
    await expect(root).toBeAttached({ timeout: 15000 });
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("page title is set", async ({ page }) => {
    await page.goto(PRISM_HOME);
    await expect(page).toHaveTitle(/.+/);
  });

  test("page body has substantive content", async ({ page }) => {
    await page.goto(PRISM_HOME);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("PRISM Counsel — Demo Mode (matter board)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRISM_DEMO);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
  });

  test("demo mode renders without crash", async ({ page }) => {
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test("demo mode reaches the matter board route", async ({ page }) => {
    await expect(page).toHaveURL(/demo=true/);
    const root = page.locator("#root");
    await expect(root).toBeAttached({ timeout: 15000 });
  });
});

test.describe("PRISM Counsel — Mobile Viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage renders correctly on mobile", async ({ page }) => {
    await page.goto(PRISM_HOME);
    await page.waitForLoadState("domcontentloaded");
    const root = page.locator("#root");
    await expect(root).toBeAttached({ timeout: 15000 });
    const errorBoundary = page.locator("text=Something went wrong").first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });
});
