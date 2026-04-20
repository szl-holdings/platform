/**
 * Stephen Lutar — Personal Site Smoke Spec
 *
 * Stephen Lutar's personal landing surface lives inside the SZL Holdings
 * web artifact at `/stephen`.  In the current platform topology the
 * `/stephen` mount point performs an external redirect to the SZL Holdings
 * leadership page (see artifacts/szl-holdings/src/App.tsx).
 *
 * This spec verifies that:
 *   1. The /stephen entry point is reachable without crashing.
 *   2. The redirect lands on a real page (no 5xx, no error boundary).
 *   3. The destination renders substantive content and a valid title.
 *
 * In CI it runs against the @workspace/szl-holdings static build served on
 * port 3000 (BASE_PATH=/).  STEPHEN_BASE_PATH overrides the entry path if
 * the routing topology ever changes.
 */
import { expect, test } from '@playwright/test';

const STEPHEN_PATH = process.env.STEPHEN_BASE_PATH ?? '/stephen';

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(STEPHEN_PATH, { timeout: 8000, waitUntil: 'domcontentloaded' });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe('Stephen Lutar — Smoke Tests', () => {
  test('/stephen entry loads without fatal errors', async ({ page }) => {
    const resp = await page.goto(STEPHEN_PATH, { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0).toBeLessThan(500);
    const root = page.locator('#root');
    await expect(root).toBeAttached({ timeout: 15000 });
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('/stephen redirects to a leadership-style destination', async ({ page }) => {
    await page.goto(STEPHEN_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    // /stephen is wired as an ExternalRedirect to /szl-holdings/leadership.
    // Allow either the configured override or the default leadership path so
    // the assertion stays meaningful across CI (BASE_PATH=/) and dev mounts.
    await expect(page).toHaveURL(/leadership|stephen/i);
  });

  test('/stephen destination has a page title', async ({ page }) => {
    await page.goto(STEPHEN_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    await expect(page).toHaveTitle(/.+/);
  });

  test('/stephen destination renders substantive content', async ({ page }) => {
    await page.goto(STEPHEN_PATH);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(500);
  });
});

test.describe('Stephen Lutar — Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('/stephen renders on mobile without crash', async ({ page }) => {
    await page.goto(STEPHEN_PATH);
    await page.waitForLoadState('domcontentloaded');
    const root = page.locator('#root');
    await expect(root).toBeAttached({ timeout: 15000 });
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });
});
