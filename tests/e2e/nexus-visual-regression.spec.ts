/**
 * PRAXIS Visual Regression Suite
 *
 * Captures full-page screenshots of key PRAXIS catalog routes and
 * compares them against committed baselines stored in
 * tests/e2e/snapshots/nexus/.
 *
 * **Baselines must be committed to the repo.** If a baseline is missing
 * in CI, the test fails with a clear message directing the developer to
 * generate and commit baselines locally first.
 *
 * Baseline generation workflow (run locally after first setup or after
 * intentional visual changes):
 *   PLAYWRIGHT_UPDATE_SNAPSHOTS=1 pnpm exec playwright test \
 *     tests/e2e/nexus-visual-regression.spec.ts
 *   git add tests/e2e/snapshots/nexus
 *   git commit -m "chore: update PRAXIS visual regression baselines"
 *
 * CI behaviour:
 *   - Runs on every PR against master/main.
 *   - Fails if any baseline PNG is missing.
 *   - Fails if any screenshot differs from baseline by more than 0.5%.
 *   - Diffs are uploaded as CI artifacts on failure.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const PRAXIS_BASE = '/nexus/';

const CATALOG_ROUTES: Array<{ hash: string; label: string }> = [
  { hash: '', label: 'home' },
  { hash: '#patterns', label: 'pattern-atlas' },
  { hash: '#design-system', label: 'design-system' },
  { hash: '#tokens-governance', label: 'tokens-governance' },
  { hash: '#research', label: 'research' },
  { hash: '#skills', label: 'skills' },
  { hash: '#memory', label: 'memory' },
  { hash: '#bridge', label: 'bridge' },
  { hash: '#orchestrator', label: 'orchestrator' },
  { hash: '#audit', label: 'audit-trail' },
];

const IN_CI = process.env['CI'] === 'true';
const UPDATE_BASELINES = process.env['PLAYWRIGHT_UPDATE_SNAPSHOTS'] === '1';
const SNAPSHOTS_DIR = join(process.cwd(), 'tests/e2e/snapshots/nexus');

function praxisStatusStub(route: import('@playwright/test').Route) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      activeSwarms: 3,
      memoryItems: 142,
      enabledSkills: 28,
      registeredTools: 67,
      orchestrationsToday: 14,
    }),
  });
}

/**
 * Capture or compare a screenshot against a committed baseline.
 *
 * - UPDATE_BASELINES=true  → always overwrite the baseline file (local only)
 * - Baseline missing + CI  → hard fail with actionable message
 * - Baseline missing + local → auto-create so developer can review & commit
 * - Baseline present        → strict pixel comparison
 */
async function assertScreenshot(
  page: import('@playwright/test').Page,
  snapshotName: string,
): Promise<void> {
  const baselinePath = join(SNAPSHOTS_DIR, `${snapshotName}.png`);
  const baselineExists = existsSync(baselinePath);

  if (UPDATE_BASELINES) {
    const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled' });
    mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    writeFileSync(baselinePath, screenshot);
    console.log(`[PRAXIS] Updated baseline: ${snapshotName}.png`);
    return;
  }

  if (!baselineExists) {
    if (IN_CI) {
      throw new Error(
        `[PRAXIS] Missing baseline: tests/e2e/snapshots/nexus/${snapshotName}.png\n` +
          `Run locally with PLAYWRIGHT_UPDATE_SNAPSHOTS=1 to generate, then commit the file.`,
      );
    }
    // Local: auto-create so the developer can inspect then commit.
    const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled' });
    mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    writeFileSync(baselinePath, screenshot);
    console.log(`[PRAXIS] Created baseline (review and commit): ${snapshotName}.png`);
    return;
  }

  await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
    maxDiffPixelRatio: 0.005,
    animations: 'disabled',
    fullPage: true,
  });
}

test.describe('PRAXIS visual regression', { tag: '@visual' }, () => {
  test.slow();

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/nexus/status', praxisStatusStub);
  });

  for (const route of CATALOG_ROUTES) {
    test(`${route.label} renders correctly`, async ({ page }) => {
      const url = `${PRAXIS_BASE}${route.hash}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      await assertScreenshot(page, `nexus-${route.label}`);
    });
  }
});

test.describe('PRAXIS token governance page visual', { tag: '@visual' }, () => {
  test('tokens-governance page shows compliance scores', async ({ page }) => {
    await page.route('**/api/nexus/status', praxisStatusStub);
    await page.goto(`${PRAXIS_BASE}#tokens-governance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await expect(page.getByText('Token Governance', { exact: false })).toBeVisible();
    await expect(page.getByText(/score|compliance|artifact/i).first()).toBeVisible();

    await assertScreenshot(page, 'nexus-tokens-governance-detail');
  });
});
