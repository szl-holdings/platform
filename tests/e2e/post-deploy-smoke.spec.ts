/**
 * Post-deploy smoke tests — one test per registered artifact.
 *
 * These tests run against a live host (production after a release, or a local
 * dev server when invoked manually).  They are intentionally lightweight:
 *
 *   1. HTTP response must be 200
 *   2. document.title must contain the expected string
 *   3. Navigation must complete within the configured time budget
 *   4. No browser console errors may be emitted during page load
 *
 * For full E2E user-journey coverage see the per-artifact spec files in
 * tests/e2e/*.spec.ts.
 *
 * Usage
 * -----
 * Against production (CI):
 *   SMOKE_BASE_URL=https://your-app.replit.app \
 *     pnpm exec playwright test tests/e2e/post-deploy-smoke.spec.ts
 *
 * Against local dev server:
 *   SMOKE_BASE_URL=http://localhost:80 \
 *     pnpm exec playwright test tests/e2e/post-deploy-smoke.spec.ts
 *
 * Run a single artifact:
 *   SMOKE_BASE_URL=https://your-app.replit.app \
 *     pnpm exec playwright test tests/e2e/post-deploy-smoke.spec.ts \
 *     --grep "Sentra"
 *
 * See docs/SMOKE_RUNBOOK.md for how to add a new artifact or triage failures.
 */

import { expect, test, type Page } from '@playwright/test';
import {
  ARTIFACT_SMOKE_CONFIGS,
  API_HEALTH_PATH,
  type ArtifactSmokeConfig,
} from '../../tools/smoke/artifact-smoke.config';

const BASE_URL = (process.env.SMOKE_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? '').replace(
  /\/$/,
  '',
);

if (!BASE_URL) {
  throw new Error(
    'SMOKE_BASE_URL (or PLAYWRIGHT_BASE_URL) must be set before running post-deploy smoke tests.\n' +
      'Example: SMOKE_BASE_URL=https://your-app.replit.app pnpm exec playwright test tests/e2e/post-deploy-smoke.spec.ts',
  );
}

/** Collect console errors that occur during a page visit. */
function attachConsoleErrorCollector(page: Page): () => string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`[pageerror] ${err.message}`);
  });
  return () => errors;
}

/** Navigate and measure wall-clock time; returns the response status. */
async function navigateWithTiming(
  page: Page,
  url: string,
): Promise<{ status: number; elapsedMs: number }> {
  const start = Date.now();
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  const elapsedMs = Date.now() - start;
  return { status: response?.status() ?? 0, elapsedMs };
}

test.describe('Post-deploy smoke — API server', () => {
  test('GET /api/health returns 200', async ({ request }) => {
    const url = `${BASE_URL}${API_HEALTH_PATH}`;
    const start = Date.now();
    const response = await request.get(url);
    const elapsedMs = Date.now() - start;

    expect(
      response.status(),
      `[api-server] ${url} returned HTTP ${response.status()} (expected 200)`,
    ).toBe(200);

    expect(
      elapsedMs,
      `[api-server] health check took ${elapsedMs}ms, expected < 5000ms`,
    ).toBeLessThan(5000);
  });
});

for (const config of ARTIFACT_SMOKE_CONFIGS) {
  const skip = config.skipInCI && !!process.env.CI;

  test.describe(`Post-deploy smoke — ${config.name}`, () => {
    test(`main route loads with HTTP 200, correct title, and no console errors`, async ({
      page,
    }) => {
      if (skip) {
        test.skip(true, `${config.name} is marked skipInCI`);
        return;
      }

      const url = `${BASE_URL}${config.path}`;
      const getErrors = attachConsoleErrorCollector(page);

      const { status, elapsedMs } = await navigateWithTiming(page, url);

      expect(
        status,
        `[${config.name}] ${url} returned HTTP ${status} (expected 200)`,
      ).toBe(200);

      const title = await page.title();
      expect(
        title,
        `[${config.name}] page title "${title}" does not contain "${config.titleContains}"`,
      ).toContain(config.titleContains);

      expect(
        elapsedMs,
        `[${config.name}] navigation took ${elapsedMs}ms, budget is ${config.timeBudgetMs}ms`,
      ).toBeLessThan(config.timeBudgetMs);

      if (config.bodyMarkers && config.bodyMarkers.length > 0) {
        for (const marker of config.bodyMarkers) {
          await expect(
            page.getByText(marker).first(),
            `[${config.name}] expected body marker "${marker}" not found`,
          ).toBeVisible({ timeout: 5000 });
        }
      }

      const consoleErrors = getErrors();
      expect(
        consoleErrors,
        `[${config.name}] console errors detected:\n${consoleErrors.join('\n')}`,
      ).toHaveLength(0);
    });
  });
}
