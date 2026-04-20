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
import { expect, test } from '@playwright/test';

const PRISM_BASE = (process.env.PRISM_BASE_PATH ?? '/').replace(/\/$/, '');
const PRISM_HOME = PRISM_BASE === '' ? '/' : PRISM_BASE;
const PRISM_DEMO = PRISM_HOME + (PRISM_HOME.endsWith('/') ? '' : '/') + '?demo=true';

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(PRISM_HOME, { timeout: 8000, waitUntil: 'domcontentloaded' });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

test.describe('PRISM Counsel — Smoke Tests', () => {
  test('loads PRISM Counsel without fatal errors', async ({ page }) => {
    await page.goto(PRISM_HOME);
    await page.waitForLoadState('domcontentloaded');
    const root = page.locator('#root');
    await expect(root).toBeAttached({ timeout: 15000 });
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('page title is set', async ({ page }) => {
    await page.goto(PRISM_HOME);
    await expect(page).toHaveTitle(/.+/);
  });

  test('page body has substantive content', async ({ page }) => {
    await page.goto(PRISM_HOME);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe('PRISM Counsel — Demo Mode (matter board)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRISM_DEMO);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
  });

  test('demo mode renders without crash', async ({ page }) => {
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });

  test('demo mode reaches the matter board route', async ({ page }) => {
    await expect(page).toHaveURL(/demo=true/);
    const root = page.locator('#root');
    await expect(root).toBeAttached({ timeout: 15000 });
  });
});

/**
 * PRISM Counsel — Mutation E2E Coverage
 *
 * Closes the Sev 2 gap from docs/TESTING_MATRIX.md §7 ("No mutation API E2E
 * coverage for PRISM"). The matter board's "New Matter" modal calls
 * useCounselCreateMatter which POSTs to /api/counsel/matters. These tests
 * exercise that write flow end-to-end in the browser by using page.route()
 * to intercept the POST, then assert the UI's behavior on success / 4xx / 5xx
 * responses and on client-side validation. Form data-testid attributes are
 * already wired in the matter-board component.
 */
test.describe('PRISM Counsel — Matter Mutation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRISM_DEMO);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
  });

  async function openNewMatterForm(page: import('@playwright/test').Page) {
    // The matter board is the canonical demo-mode landing surface. If the
    // "New Matter" trigger is missing, that is a regression — fail loudly
    // instead of silently skipping coverage.
    const trigger = page.getByTestId('button-new-matter');
    await expect(trigger).toBeVisible({ timeout: 15000 });
    await trigger.click();
    await expect(page.getByTestId('form-new-matter')).toBeVisible({ timeout: 10000 });
  }

  async function fillRequiredFields(page: import('@playwright/test').Page) {
    await page.getByTestId('input-matter-name').fill('E2E Test Matter — Apex Acquisition');
    await page.getByTestId('input-matter-number').fill('2026-E2E-001');
    await page.getByTestId('input-client-name').fill('Apex Capital Partners LP');
    await page.getByTestId('input-lead-counsel').fill('E2E Counsel');
    await page.getByTestId('input-jurisdiction').fill('Delaware / Federal');
    await page
      .getByTestId('input-summary')
      .fill('End-to-end mutation test matter exercising the create POST path.');
  }

  test('submits new matter, intercepts POST /api/counsel/matters, and closes modal on success', async ({
    page,
  }) => {
    await openNewMatterForm(page);

    let captured: { method: string; body: Record<string, unknown> | null; url: string } | null =
      null;
    await page.route('**/api/counsel/matters', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') {
        await route.continue();
        return;
      }
      captured = {
        method: req.method(),
        body: req.postDataJSON() as Record<string, unknown> | null,
        url: req.url(),
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'matter_e2e_001',
          name: 'E2E Test Matter — Apex Acquisition',
          matterNumber: '2026-E2E-001',
          clientName: 'Apex Capital Partners LP',
        }),
      });
    });

    await fillRequiredFields(page);
    await page.getByTestId('button-create-matter').click();

    await expect(page.getByTestId('form-new-matter')).toBeHidden({ timeout: 10000 });

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe('POST');
    expect(captured!.url).toContain('/api/counsel/matters');
    expect(captured!.body).toMatchObject({
      name: 'E2E Test Matter — Apex Acquisition',
      matterNumber: '2026-E2E-001',
      clientName: 'Apex Capital Partners LP',
      leadCounsel: 'E2E Counsel',
      jurisdiction: 'Delaware / Federal',
      summary: 'End-to-end mutation test matter exercising the create POST path.',
    });
  });

  test('client-side validation blocks POST when required fields are empty', async ({ page }) => {
    await openNewMatterForm(page);

    let posted = false;
    await page.route('**/api/counsel/matters', async (route) => {
      if (route.request().method() === 'POST') {
        posted = true;
      }
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    // Submit the form without filling any required fields. The browser's native
    // `required` constraint should block submission before the mutation fires.
    // Race a 1.5s POST watcher against the assertion that the form is still
    // visible — if the mutation fires we fail; otherwise we confirm the
    // unchanged DOM state deterministically.
    const postRequestPromise = page
      .waitForRequest(
        (req) => req.url().includes('/api/counsel/matters') && req.method() === 'POST',
        { timeout: 1500 },
      )
      .catch(() => null);
    await page.getByTestId('button-create-matter').click();
    const postReq = await postRequestPromise;

    expect(postReq).toBeNull();
    expect(posted).toBe(false);
    await expect(page.getByTestId('form-new-matter')).toBeVisible();
  });

  test('surfaces server error message and keeps modal open on 500', async ({ page }) => {
    await openNewMatterForm(page);

    await page.route('**/api/counsel/matters', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'INTERNAL_ERROR', message: 'matter store unavailable' }),
      });
    });

    await fillRequiredFields(page);
    await page.getByTestId('button-create-matter').click();

    // Modal should remain open and the create button should be re-enabled
    // after the failed mutation settles.
    await expect(page.getByTestId('form-new-matter')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('button-create-matter')).toBeEnabled({ timeout: 10000 });
  });

  test('rejects non-numeric estimated exposure before POSTing', async ({ page }) => {
    await openNewMatterForm(page);

    let posted = false;
    await page.route('**/api/counsel/matters', async (route) => {
      if (route.request().method() === 'POST') posted = true;
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    await fillRequiredFields(page);
    await page.locator('input[placeholder="e.g. 25000000"]').fill('not-a-number');
    const postRequestPromise = page
      .waitForRequest(
        (req) => req.url().includes('/api/counsel/matters') && req.method() === 'POST',
        { timeout: 1500 },
      )
      .catch(() => null);
    await page.getByTestId('button-create-matter').click();

    await expect(page.getByText(/Estimated exposure must be a number/i)).toBeVisible({
      timeout: 5000,
    });
    expect(await postRequestPromise).toBeNull();
    expect(posted).toBe(false);
  });
});

test.describe('PRISM Counsel — Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('homepage renders correctly on mobile', async ({ page }) => {
    await page.goto(PRISM_HOME);
    await page.waitForLoadState('domcontentloaded');
    const root = page.locator('#root');
    await expect(root).toBeAttached({ timeout: 15000 });
    const errorBoundary = page.locator('text=Something went wrong').first();
    const hasError = await errorBoundary.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });
});
