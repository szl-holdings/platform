/**
 * Portfolio Dashboard, Academy Progress, and Investors Data Room — E2E Coverage
 *
 * Focused coverage for task #2851:
 *   1. /portfolio renders the six module tiles when the ecosystem-summary
 *      API returns data, and shows the error banner when that API fails.
 *   2. /academy progress checkboxes persist across page navigation via
 *      localStorage (read on mount through `loadProgress`).
 *   3. /investors/data-room is gated by RequireAuth — unauthenticated
 *      visitors see the "Authentication Required" wall with a Sign In
 *      button that initiates the OIDC login flow, instead of the data
 *      room contents.
 *
 * The /api/auth/user endpoint is mocked at the network level so the tests
 * do not depend on a live OIDC provider. The /api/holdings/ecosystem-summary
 * endpoint is mocked to deterministically exercise both success and error
 * states for the portfolio dashboard.
 */
import { expect, test, type Page } from '@playwright/test';

const BASE_PATH = process.env.SZL_BASE_PATH ?? '/';

const AUTH_USER_URL = '**/api/auth/user';
const ECOSYSTEM_SUMMARY_URL = '**/api/holdings/ecosystem-summary';

const MOCK_ECOSYSTEM_SUMMARY = {
  checkedAt: new Date('2026-01-15T12:00:00Z').toISOString(),
  alloy: { workflowRuns: 142 },
  lyte: { incidents: 7 },
  vessels: { trackedVessels: 1284, fleets: 9 },
  aegis: { incidents: 3, findings: 18 },
  terra: { distressProperties: 26, activeDeals: 4 },
  carlotaJo: { inquiries: 11 },
};

async function routeUnauthenticated(page: Page) {
  await page.route(AUTH_USER_URL, (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ user: null }),
    }),
  );
}

async function routeEcosystemSuccess(page: Page) {
  await page.route(ECOSYSTEM_SUMMARY_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ECOSYSTEM_SUMMARY),
    }),
  );
}

async function routeEcosystemFailure(page: Page) {
  await page.route(ECOSYSTEM_SUMMARY_URL, (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'service_unavailable' }),
    }),
  );
}

function url(path: string): string {
  return `${BASE_PATH}${path}`.replace('//', '/');
}

// ---------------------------------------------------------------------------
// /portfolio
// ---------------------------------------------------------------------------

test.describe('Portfolio Dashboard — /portfolio', () => {
  test('renders all six module tiles when the ecosystem-summary API succeeds', async ({ page }) => {
    await routeEcosystemSuccess(page);
    await page.goto(url('portfolio'));
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    // Tile names rendered in the dashboard. Note: the Aegis vertical is
    // surfaced as the "Sentra" product tile in the portfolio UI.
    const tiles = ['Lyte', 'Terra', 'Vessels', 'Sentra', 'Alloy', 'Carlota Jo'];
    for (const name of tiles) {
      await expect(page.locator(`:text("${name}")`).first()).toBeVisible({ timeout: 15_000 });
    }

    // Error banner should NOT be visible on the success path.
    const errorBanner = page.locator(':text("Could not load live signal data")');
    await expect(errorBanner).toHaveCount(0);
  });

  test('shows the error banner when the ecosystem-summary API is unavailable', async ({ page }) => {
    await routeEcosystemFailure(page);
    await page.goto(url('portfolio'));
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    const errorBanner = page.locator(':text("Could not load live signal data")').first();
    await expect(errorBanner).toBeVisible({ timeout: 15_000 });

    // Tiles should still render (with placeholder values) even when the API fails.
    await expect(page.locator(':text("Lyte")').first()).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// /academy
// ---------------------------------------------------------------------------

test.describe('Academy Progress — /academy', () => {
  test('progress saved to localStorage persists after navigating away and back', async ({ page }) => {
    // Initial visit — establish localStorage origin.
    await page.goto(url('academy'));
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    // Seed two completed paths via the same key the page uses (`STORAGE_KEY`
    // in academy.tsx) so we don't depend on hit-testing animated SVG buttons.
    await page.evaluate(() => {
      const progress = {
        'platform-foundations': true,
        'lyte-observability': true,
      };
      localStorage.setItem('szl-academy-progress-v1', JSON.stringify(progress));
    });

    // Navigate away …
    await page.goto(url(''));
    await page.waitForLoadState('domcontentloaded');

    // … and back. The page should re-hydrate progress from localStorage.
    await page.goto(url('academy'));
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    const stored = await page.evaluate(() =>
      localStorage.getItem('szl-academy-progress-v1'),
    );
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!) as Record<string, boolean>;
    expect(parsed['platform-foundations']).toBe(true);
    expect(parsed['lyte-observability']).toBe(true);

    // Progress summary should reflect the seeded count ("2 / 6 paths").
    await expect(page.locator(':text("2 / 6 paths")').first()).toBeVisible({ timeout: 15_000 });
  });

  test('clicking a "Mark as complete" checkbox persists across navigation', async ({ page }) => {
    await page.goto(url('academy'));
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    // Make sure we start from a clean slate so the count assertion is stable.
    await page.evaluate(() => localStorage.removeItem('szl-academy-progress-v1'));
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    // Click the first path's "Mark as complete" toggle (rendered as a button
    // with an accessible label of "Mark as complete").
    const markComplete = page
      .getByRole('button', { name: 'Mark as complete' })
      .first();
    await expect(markComplete).toBeVisible({ timeout: 15_000 });
    await markComplete.click();

    // The toggle's label flips once the path is complete, and the count
    // updates to "1 / 6 paths".
    await expect(page.locator(':text("1 / 6 paths")').first()).toBeVisible({ timeout: 10_000 });

    // Navigate away and back — the path should still be marked complete.
    await page.goto(url(''));
    await page.waitForLoadState('domcontentloaded');
    await page.goto(url('academy'));
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    await expect(page.locator(':text("1 / 6 paths")').first()).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('button', { name: 'Mark as incomplete' }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('reset progress clears the stored localStorage entry', async ({ page }) => {
    await page.goto(url('academy'));
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    await page.evaluate(() => {
      localStorage.setItem(
        'szl-academy-progress-v1',
        JSON.stringify({ 'platform-foundations': true }),
      );
    });

    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    const resetButton = page.locator("button:has-text('Reset progress')").first();
    await expect(resetButton).toBeVisible({ timeout: 10_000 });
    await resetButton.click();

    const stored = await page.evaluate(() =>
      localStorage.getItem('szl-academy-progress-v1'),
    );
    // After reset, the value is the JSON encoding of an empty object.
    expect(stored).toBe('{}');
  });
});

// ---------------------------------------------------------------------------
// /investors/data-room
// ---------------------------------------------------------------------------

test.describe('Investors Data Room — /investors/data-room', () => {
  test('shows the Authentication Required wall when the visitor has no session', async ({ page }) => {
    await routeUnauthenticated(page);
    await page.goto(url('investors/data-room'));
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    // The RequireAuth wrapper renders an auth wall instead of the data room
    // contents when the session is unauthenticated.
    await expect(page.locator('text=Authentication Required')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=Sign in to access this section.')).toBeVisible();
    // The auth wall renders an exact "Sign In" button (distinct from the
    // global nav's "Sign in" trigger).
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();

    // The actual data room UI (NDA gate / document sidebar) should NOT be
    // rendered for unauthenticated visitors.
    await expect(page.locator('text=Data Room — NDA Confirmation')).toHaveCount(0);
  });

  test('Sign In button on the auth wall initiates the /api/login redirect', async ({ page }) => {
    await routeUnauthenticated(page);

    // Intercept the OIDC entry point so the test does not depend on a live
    // API server. We just need to assert the navigation was attempted.
    let loginRequested = false;
    await page.route('**/api/login**', (route) => {
      loginRequested = true;
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>mock-login</body></html>',
      });
    });

    await page.goto(url('investors/data-room'));
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => null);

    const signInButton = page.getByRole('button', { name: 'Sign In', exact: true });
    await expect(signInButton).toBeVisible({ timeout: 15_000 });

    await Promise.all([
      page.waitForURL((u) => u.pathname.startsWith('/api/login'), { timeout: 10_000 }),
      signInButton.click(),
    ]);

    expect(loginRequested).toBe(true);
    expect(page.url()).toMatch(/\/api\/login/);
  });
});
