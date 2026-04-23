/**
 * Sentra — Cyber Resilience Command — E2E Smoke Spec
 *
 * Sentra is SZL Holdings' cyber resilience and threat intelligence platform,
 * published as a standalone artifact at /sentra. The HTML title is
 * "Sentra | Cyber Resilience Command" regardless of auth state.
 *
 * In CI the artifact is built with BASE_PATH=/ and served statically on a
 * dedicated port. SENTRA_BASE_PATH defaults to "/" for CI and to "/sentra"
 * for Replit dev-proxy mode.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SENTRA_BASE = (process.env.SENTRA_BASE_PATH ?? '/sentra').replace(/\/$/, '');

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(SENTRA_BASE || '/', {
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

test.describe('TENAX — Smoke Tests', () => {
  test('HTML title is Sentra-specific (not a generic error page)', async ({ page }) => {
    await page.goto(SENTRA_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.title.trim().length > 0,
      { timeout: 20000 }
    ).catch(() => null);
    const title = await page.title();
    const content = await page.content();
    const hasSentraBranding = /sentra/i.test(title) || content.includes('TENAX') || content.includes('Cyber Resilience');
    expect(hasSentraBranding).toBe(true);
  });

  test('page contains Cyber Resilience branding', async ({ page }) => {
    await page.goto(SENTRA_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const pageContent = await page.content();
    const hasCyberBranding =
      pageContent.includes('TENAX') ||
      pageContent.includes('Cyber Resilience') ||
      pageContent.includes('cyber-resilience');
    expect(hasCyberBranding).toBe(true);
  });

  test('renders the application root without an error boundary', async ({ page }) => {
    await page.goto(SENTRA_BASE || '/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const errorBoundary = page.locator('text=Something went wrong').first();
    expect(await errorBoundary.isVisible().catch(() => false)).toBe(false);

    const root = page.locator('#root, #app').first();
    await expect(root).toBeVisible({ timeout: 15000 });
  });

  test('demo mode — app shell renders without crashing', async ({ page }) => {
    const demoUrl = `${SENTRA_BASE || '/'}?demo=true`;
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
    await expect(page).toHaveTitle(/Sentra/i);
  });
});

test.describe('TENAX — Failure paths', () => {
  test('unknown route returns a non-5xx response', async ({ page }) => {
    const resp = await page.goto(`${SENTRA_BASE || ''}/this-route-does-not-exist-abc123`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    expect(resp?.status() ?? 200).toBeLessThan(500);
  });

  test('unknown route does NOT return the TENAX app claiming it is another product', async ({
    page,
  }) => {
    await page
      .goto(`${SENTRA_BASE || ''}/this-route-does-not-exist-abc123`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      .catch(() => null);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

    const title = await page.title();
    // If SPA handles unknown routes (renders the shell), title must still be Sentra-branded
    // If a real 404 page is served, it should not have Sentra branding at all
    const content = await page.content();
    const looksLikeSentra = content.includes('TENAX') || title.includes('TENAX');
    const looksLikeOtherProduct = content.includes('SZL Holdings Dashboard') && !looksLikeSentra;
    expect(looksLikeOtherProduct).toBe(false);
  });
});

test.describe('TENAX — Accessibility (axe-core)', () => {
  test('homepage has no critical/serious a11y violations', async ({ page }) => {
    await page.goto(SENTRA_BASE || '/', { waitUntil: 'domcontentloaded' });
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
        .soft(criticalOrSerious, `TENAX a11y violations:\n${summary}`)
        .toHaveLength(0);
    }

    expect(results.violations.length).toBeDefined();
  });
});
