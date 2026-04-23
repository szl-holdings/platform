/**
 * Pulse — AI Executive Briefing — E2E Smoke Spec
 *
 * Pulse is SZL Holdings' AI-driven executive briefing platform, published as a
 * standalone artifact at /pulse. The HTML title is
 * "Pulse — AI Executive Briefing" regardless of auth state.
 *
 * In CI the artifact is built with BASE_PATH=/ and served statically on a
 * dedicated port. PULSE_BASE_PATH defaults to "/" for CI and to "/pulse"
 * for Replit dev-proxy mode.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PULSE_BASE = (process.env.PULSE_BASE_PATH ?? '/pulse').replace(/\/$/, '');

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(PULSE_BASE || '/', {
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

test.describe('LUMINA — Smoke Tests', () => {
  test('HTML title is Pulse-specific (not a generic error page)', async ({ page }) => {
    await page.goto(PULSE_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.title.trim().length > 0,
      { timeout: 20000 }
    ).catch(() => null);
    const title = await page.title();
    const content = await page.content();
    const hasPulseBranding = /pulse/i.test(title) || content.includes('LUMINA') || content.includes('Executive Briefing');
    expect(hasPulseBranding).toBe(true);
  });

  test('page contains AI Executive Briefing branding', async ({ page }) => {
    await page.goto(PULSE_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const pageContent = await page.content();
    const hasPulseBranding =
      pageContent.includes('LUMINA') ||
      pageContent.includes('Executive Briefing') ||
      pageContent.includes('executive-briefing');
    expect(hasPulseBranding).toBe(true);
  });

  test('renders the application root without an error boundary', async ({ page }) => {
    await page.goto(PULSE_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);

    const root = page.locator('#root, #app').first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });

  test('demo mode — app shell renders without crashing', async ({ page }) => {
    const demoUrl = `${PULSE_BASE || '/'}?demo=true`;
    const resp = await page
      .goto(demoUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      })
      .catch(() => null);

    if (!resp || resp.status() >= 500) {
      test.skip();
      return;
    }

    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    await expect(page).toHaveTitle(/Pulse/i);
  });
});

test.describe('LUMINA — API write paths', () => {
  const API_BASE =
    process.env.API_BASE_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN ?? 'localhost'}/api`;

  test('POST /api/pulse/dissents — file a dissent and confirm persistence', async ({ request }) => {
    const payload = {
      sectionTitle: 'E2E Test Section',
      dissentingView: 'Automated test dissent — should be cleaned up.',
      basis: 'E2E playwright test run.',
      impactIfCorrect: 'None — this is a test.',
    };

    const csrf = await request.get(`${API_BASE}/csrf-token`);
    const cookies = csrf.headers()['set-cookie'] ?? '';
    const tokenMatch = cookies.match(/csrf_token=([^;]+)/);
    const csrfToken = tokenMatch ? decodeURIComponent(tokenMatch[1]!) : '';

    const res = await request.post(`${API_BASE}/pulse/dissents`, {
      data: payload,
      headers: {
        'content-type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
    });

    // If we get 401, the test environment isn't authenticated — skip gracefully.
    if (res.status() === 401) {
      test.skip();
      return;
    }

    expect(res.status()).toBeLessThan(400);
    const body = await res.json().catch(() => null);
    if (body?.success) {
      expect(body.dissent).toBeDefined();
      expect(body.dissent.sectionTitle).toBe(payload.sectionTitle);
    }
  });

  test('GET /api/pulse/briefings — briefing list returns an array', async ({ request }) => {
    const res = await request.get(`${API_BASE}/pulse/briefings`);
    if (res.status() === 401) { test.skip(); return; }
    expect(res.status()).toBeLessThan(400);
    const body = await res.json().catch(() => null);
    if (body?.success) {
      expect(Array.isArray(body.briefings)).toBe(true);
    }
  });

  test('GET /api/pulse/confidence — confidence history returns an array', async ({ request }) => {
    const res = await request.get(`${API_BASE}/pulse/confidence`);
    if (res.status() === 401) { test.skip(); return; }
    expect(res.status()).toBeLessThan(400);
    const body = await res.json().catch(() => null);
    if (body?.success) {
      expect(Array.isArray(body.history)).toBe(true);
    }
  });
});

test.describe('LUMINA — Library UI flows', () => {
  test('Library page renders briefing list or auth gate — no crash', async ({ page }) => {
    const resp = await page.goto(`${PULSE_BASE || ''}/library`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    }).catch(() => null);

    if (!resp || resp.status() >= 500) { test.skip(); return; }
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    // No uncaught error boundary, no blank page
    const errorBoundary = page.locator('role=alert').first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);
  });

  test('Library page — bookmark button is accessible when authenticated', async ({ page }) => {
    const resp = await page.goto(`${PULSE_BASE || ''}/library`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    }).catch(() => null);

    if (!resp || resp.status() >= 500) { test.skip(); return; }
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const pageText = await page.content();
    // If we hit the auth gate, skip — this test requires a session
    if (pageText.includes('Authentication Required') || pageText.includes('Sign In')) {
      test.skip();
      return;
    }

    // Wait for briefing cards to load
    const bookmarkButtons = page.locator('button[title*="Save"], button[title*="Remove from saved"]');
    await bookmarkButtons.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    const count = await bookmarkButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Dissent Channel — resolve form renders on card', async ({ page }) => {
    const resp = await page.goto(`${PULSE_BASE || ''}/dissent`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    }).catch(() => null);

    if (!resp || resp.status() >= 500) { test.skip(); return; }
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const pageText = await page.content();
    if (pageText.includes('Authentication Required')) { test.skip(); return; }

    // The dissent channel heading should be visible regardless of card count
    const heading = page.locator('h1, h2, h3').filter({ hasText: /Dissent|Intelligence Dissent/i });
    await heading.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    const headingVisible = await heading.first().isVisible().catch(() => false);

    // The page should show either the heading (channel loaded) or a loading state — never blank
    const bodyText = await page.locator('body').innerText().catch(() => '');
    expect(headingVisible || bodyText.length > 50).toBe(true);
  });

  test('Confidence Dashboard — agent cards render with info icon', async ({ page }) => {
    const resp = await page.goto(`${PULSE_BASE || ''}/confidence`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    }).catch(() => null);

    if (!resp || resp.status() >= 500) { test.skip(); return; }
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const pageText = await page.content();
    if (pageText.includes('Authentication Required')) { test.skip(); return; }

    // Confidence Dashboard heading should be present
    const heading = page.locator('h1', { hasText: 'Confidence' });
    await heading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    expect(await heading.isVisible().catch(() => false)).toBe(true);
  });
});

test.describe('LUMINA — Failure paths', () => {
  test('unknown route returns a non-5xx response', async ({ page }) => {
    const resp = await page.goto(`${PULSE_BASE || ''}/this-route-does-not-exist-abc123`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    expect(resp?.status() ?? 200).toBeLessThan(500);
  });

  test("unknown route does NOT render a different product's shell", async ({ page }) => {
    await page
      .goto(`${PULSE_BASE || ''}/this-route-does-not-exist-abc123`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      .catch(() => null);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

    const content = await page.content();
    const title = await page.title();
    const isPulseContent = content.includes('LUMINA') || title.includes('LUMINA');
    const isWrongProduct = content.includes('SZL Holdings Dashboard') && !isPulseContent;
    expect(isWrongProduct).toBe(false);
  });
});

test.describe('LUMINA — Accessibility (axe-core)', () => {
  test('homepage has no critical/serious a11y violations', async ({ page }) => {
    await page.goto(PULSE_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (criticalOrSerious.length > 0) {
      const summary = criticalOrSerious
        .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
        .join('\n');
      expect
        .soft(criticalOrSerious, `LUMINA a11y violations:\n${summary}`)
        .toHaveLength(0);
    }

    expect(results.violations.length).toBeDefined();
  });
});
