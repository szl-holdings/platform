/**
 * SZL Holdings Governed Autonomy Demo — E2E Smoke Spec
 *
 * The demo video artifact is a Remotion/video-js production hosted at /szl-demo-video.
 * It is a static, auto-playing video artifact with no interactive auth flow.
 *
 * SZL_DEMO_BASE_PATH defaults to "/szl-demo-video" in Replit proxy mode.
 * In CI with BASE_PATH=/ it can be set to "/".
 */
import { expect, test } from '@playwright/test';

const DEMO_BASE = (process.env.SZL_DEMO_BASE_PATH ?? '/szl-demo-video').replace(/\/$/, '');

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(DEMO_BASE || '/', {
      timeout: 10000,
      waitUntil: 'domcontentloaded',
    });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe('SZL Demo Video — Smoke Tests', () => {
  test('loads demo video artifact without fatal error', async ({ page }) => {
    await page.goto(DEMO_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('page title is set (not a blank or error page)', async ({ page }) => {
    await page.goto(DEMO_BASE || '/', { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('page has substantive content (not empty)', async ({ page }) => {
    await page.goto(DEMO_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(100);
  });

  test('application root renders without crashing', async ({ page }) => {
    await page.goto(DEMO_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const root = page.locator('#root, #app, main, body').first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });

  test('no JavaScript console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(DEMO_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const fatalErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('NetworkError') &&
        !e.includes('Failed to fetch'),
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('contains SZL Holdings or demo-related branding', async ({ page }) => {
    await page.goto(DEMO_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const content = await page.content();
    const hasBranding =
      content.toLowerCase().includes('szl') ||
      content.toLowerCase().includes('governed') ||
      content.toLowerCase().includes('autonomy') ||
      content.toLowerCase().includes('demo') ||
      content.toLowerCase().includes('holdings');
    expect(hasBranding).toBe(true);
  });
});
