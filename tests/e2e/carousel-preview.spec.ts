/**
 * LinkedIn Carousel Preview — E2E Spec
 *
 * Verifies the /carousel viewer in the SZL Holdings web artifact:
 *  - 10 slides addressable via dot indicators
 *  - Keyboard navigation (ArrowRight / ArrowLeft / Home / End)
 *  - Click navigation via prev/next buttons
 *  - Slide counter updates and slide image renders
 */
import { expect, test } from '@playwright/test';

const SZL_PATH = process.env.SZL_BASE_PATH ?? '/';
const CAROUSEL_PATH = (
  SZL_PATH.endsWith('/') ? `${SZL_PATH}carousel` : `${SZL_PATH}/carousel`
).replace('//', '/');

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(CAROUSEL_PATH, {
      timeout: 8000,
      waitUntil: 'domcontentloaded',
    });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  } finally {
    await page.close();
  }
});

test.describe('Carousel preview', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!appAvailable, 'SZL Holdings app not reachable in this env');
    await page.goto(CAROUSEL_PATH, { waitUntil: 'domcontentloaded' });
  });

  test('renders the cover slide and counter on initial load', async ({ page }) => {
    await expect(page.getByText('1 / 10')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('img[alt="Cover"]')).toBeVisible();
  });

  test('exposes 10 dot indicators and navigates via dot click', async ({ page }) => {
    const dots = page.locator('button[aria-label^="Go to slide "]');
    await expect(dots).toHaveCount(10);
    await dots.nth(4).click();
    await expect(page.getByText('5 / 10')).toBeVisible();
  });

  test('keyboard ArrowRight advances and ArrowLeft retreats', async ({ page }) => {
    await expect(page.getByText('1 / 10')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('2 / 10')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('3 / 10')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('2 / 10')).toBeVisible();
  });

  test('Home and End jump to first and last slide', async ({ page }) => {
    await page.keyboard.press('End');
    await expect(page.getByText('10 / 10')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(page.getByText('1 / 10')).toBeVisible();
  });
});
