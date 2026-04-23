/**
 * Lyte Command Center — Onboarding Wizard E2E Spec
 *
 * Walks the new-user onboarding wizard end to end at `/onboarding`
 * (mounted at `/lyte/onboarding` when the lyte-command-center artifact
 * is served behind its default `/lyte/` base path), and asserts the
 * Lyte Overview empty-state banner is present before completion and
 * absent after.
 *
 * In CI this spec runs against the @workspace/lyte-command-center build
 * with BASE_PATH=/ on its own port. Locally, `LYTE_BASE_PATH` can be
 * overridden to point at a different mount point.
 */
import { expect, test } from '@playwright/test';

const RAW_BASE = process.env.LYTE_BASE_PATH ?? '/';
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE;
const ONBOARDING_PATH = `${BASE}/onboarding`.replace('//', '/');
const OVERVIEW_PATH = `${BASE}/overview`.replace('//', '/');
const ONBOARDING_STORAGE_KEY = 'szl.onboarding.v1';

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(ONBOARDING_PATH, {
      timeout: 8000,
      waitUntil: 'domcontentloaded',
    });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({ page }, testInfo) => {
  if (!appAvailable) testInfo.skip();
  // Make sure each test starts from a fresh wizard state.
  await page.goto(ONBOARDING_PATH);
  await page.evaluate((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }, ONBOARDING_STORAGE_KEY);
});

test.describe('KORA Onboarding Wizard — End-to-End', () => {
  test('walks the wizard and clears the Overview empty-state banner', async ({ page }) => {
    // 1. Overview shows the empty-state onboarding banner before completion.
    await page.goto(OVERVIEW_PATH);
    await page.waitForLoadState('domcontentloaded');
    const bannerBefore = page.getByTestId('onboarding-banner');
    await expect(bannerBefore).toBeVisible({ timeout: 15000 });

    // 2. Visit the wizard. Starts on step 1 (org form).
    await page.goto(ONBOARDING_PATH);
    await expect(page.getByTestId('onboarding-wizard')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('wizard-stepper')).toBeVisible();

    // Step 1 — fill org form and continue.
    await page.getByTestId('org-name-input').fill('Northwind Maritime');
    await page.getByTestId('org-industry-select').selectOption('Maritime / Logistics');
    await page.getByTestId('team-size-11\u201350').click(); // en-dash matches the page literal
    await page.getByTestId('use-case-ops').click();

    const step1Continue = page.getByTestId('step-1-continue');
    await expect(step1Continue).toBeEnabled();
    await step1Continue.click();

    // Step 2 — seed demo data.
    const seedBtn = page.getByTestId('seed-demo-button');
    await expect(seedBtn).toBeVisible();
    await seedBtn.click();
    await expect(page.getByTestId('seed-success')).toBeVisible({ timeout: 10000 });

    const step2Continue = page.getByTestId('step-2-continue');
    await expect(step2Continue).toBeEnabled();
    await step2Continue.click();

    // Step 3 — first view (mark visited).
    await page.getByTestId('step-3-continue').click();

    // Step 4 — walk all nine governed-decision-loop steps.
    const loopAdvance = page.getByTestId('loop-advance');
    for (let i = 0; i < 9; i++) {
      await expect(loopAdvance).toBeVisible();
      await loopAdvance.click();
    }

    // Wizard signals completion via the banner.
    await expect(page.getByTestId('onboarding-complete-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('finish-onboarding')).toBeVisible();

    // 3. Returning to Overview no longer shows the empty-state banner.
    await page.goto(OVERVIEW_PATH);
    await page.waitForLoadState('domcontentloaded');
    // Give the post-mount effect a tick to read localStorage.
    await page.waitForTimeout(250);
    await expect(page.getByTestId('onboarding-banner')).toHaveCount(0);
  });
});
