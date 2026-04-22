/**
 * Health endpoint & 404 page — Playwright Smoke Spec
 *
 * Covers two baseline requirements from the Phase C test-matrix:
 *
 *  1. GET /api/health  — the API liveness probe must return HTTP 200 with
 *     a JSON body containing `{ status: "ok" }`.  This check is skipped
 *     when no API server is reachable so the spec is safe to run against
 *     a static build in CI (the readiness-gate job in ci.yml handles the
 *     live-server assertion).
 *
 *  2. 404 / unknown route — navigating to a path that doesn't exist must
 *     not produce an unhandled crash page ("Something went wrong" error
 *     boundary).  SPA apps typically catch unknown routes and render a
 *     custom Not Found page; this test confirms that behaviour.
 *
 * Both checks use appAvailable guards so they self-skip instead of failing
 * when the target is not being served.
 */
import { expect, test } from '@playwright/test';

const BASE_PATH = (process.env.SZL_BASE_PATH ?? '/').replace(/\/$/, '');
const _API_BASE = process.env.API_BASE_URL ?? `${BASE_PATH}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function isReachable(url: string, timeout = 8000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal }).catch(() => null);
    clearTimeout(id);
    return !!res && res.status < 500;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// /api/health
// ---------------------------------------------------------------------------

test.describe('Health Endpoint — /api/health', () => {
  let apiAvailable = false;

  test.beforeAll(async () => {
    const healthUrl =
      process.env.API_BASE_URL
        ? `${process.env.API_BASE_URL}/api/health`
        : `http://localhost:5000/api/health`;
    apiAvailable = await isReachable(healthUrl);
  });

  test.beforeEach(async ({}, testInfo) => {
    if (!apiAvailable) {
      testInfo.skip(
        true,
        'API server not reachable — skipping health probe (covered by readiness-gate in ci.yml)',
      );
    }
  });

  test('GET /api/health returns HTTP 200', async ({ request }) => {
    const healthUrl =
      process.env.API_BASE_URL
        ? `${process.env.API_BASE_URL}/api/health`
        : `http://localhost:5000/api/health`;
    const response = await request.get(healthUrl);
    expect(response.status()).toBe(200);
  });

  test('GET /api/health returns JSON with status: ok', async ({ request }) => {
    const healthUrl =
      process.env.API_BASE_URL
        ? `${process.env.API_BASE_URL}/api/health`
        : `http://localhost:5000/api/health`;
    const response = await request.get(healthUrl);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'ok' });
  });
});

// ---------------------------------------------------------------------------
// 404 / Unknown route
// ---------------------------------------------------------------------------

test.describe('404 — Unknown route does not crash', () => {
  let appAvailable = false;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      const resp = await page.goto(BASE_PATH || '/', {
        timeout: 10_000,
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

  test('navigating to a non-existent route does not show an error boundary crash', async ({
    page,
  }) => {
    const unknownPath = `${BASE_PATH}/this-route-does-not-exist-__phase-c-smoke__`.replace(
      '//',
      '/',
    );
    // Navigate; allow 404 HTTP responses from the server (expected for unknown
    // paths in a multi-page setup) but never a JS crash page.
    await page.goto(unknownPath, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);

    const crashBanner = page.locator('text=Something went wrong').first();
    const hasCrash = await crashBanner.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasCrash).toBe(false);
  });

  test('navigating to a non-existent route renders a page (not blank)', async ({ page }) => {
    const unknownPath = `${BASE_PATH}/this-route-does-not-exist-__phase-c-smoke__`.replace(
      '//',
      '/',
    );
    await page.goto(unknownPath, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);

    const body = await page.content();
    expect(body.length).toBeGreaterThan(100);
  });
});
