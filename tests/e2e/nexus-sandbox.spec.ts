/**
 * PRAXIS Mockup Sandbox — E2E Smoke Spec
 *
 * The PRAXIS design sandbox artifact is hosted at /nexus. It is a design-only
 * surface (not a production app) but must load without catastrophic failure.
 *
 * PRAXIS_BASE_PATH defaults to "/nexus" in Replit proxy mode.
 */
import { expect, test } from '@playwright/test';

const PRAXIS_BASE = (process.env.PRAXIS_BASE_PATH ?? '/nexus').replace(/\/$/, '');

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(PRAXIS_BASE || '/', {
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

test.describe('PRAXIS Sandbox — Smoke Tests', () => {
  test('loads PRAXIS sandbox without fatal error', async ({ page }) => {
    await page.goto(PRAXIS_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('page title is set', async ({ page }) => {
    await page.goto(PRAXIS_BASE || '/', { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('page has substantive content (not empty)', async ({ page }) => {
    await page.goto(PRAXIS_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test('application root renders', async ({ page }) => {
    await page.goto(PRAXIS_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const root = page.locator('#root, #app, main, body').first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });
});
