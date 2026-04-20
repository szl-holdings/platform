#!/usr/bin/env tsx

/**
 * SZL Holdings — Screenshot Capture Pipeline
 *
 * Playwright-based screenshot capture for all products.
 * Captures dark-premium, enterprise-grade screenshots at consistent viewports.
 *
 * Usage:
 *   npx tsx scripts/media/capture-screenshots.ts
 *   npx tsx scripts/media/capture-screenshots.ts --product lyte
 *   npx tsx scripts/media/capture-screenshots.ts --output docs/media/screenshots
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:80';
const OUTPUT_DIR =
  process.argv.find((_, i) => process.argv[i - 1] === '--output') || 'docs/media/screenshots';
const PRODUCT_FILTER = process.argv.find((_, i) => process.argv[i - 1] === '--product');

interface ScreenshotTarget {
  product: string;
  name: string;
  url: string;
  filename: string;
  viewport: { width: number; height: number };
  waitFor?: string;
  clip?: { x: number; y: number; width: number; height: number };
}

const TARGETS: ScreenshotTarget[] = [
  {
    product: 'szl-holdings',
    name: 'SZL Holdings — Landing Hero',
    url: `${BASE_URL}/`,
    filename: 'landing-hero.jpg',
    viewport: { width: 1440, height: 900 },
    waitFor: '.hero-section, h1, [data-hero]',
  },
  {
    product: 'lyte',
    name: 'Lyte — Marketing Landing',
    url: `${BASE_URL}/lyte-command-center/`,
    filename: 'lyte-overview.jpg',
    viewport: { width: 1440, height: 900 },
    waitFor: 'h1, .hero-section, nav',
  },
  {
    product: 'lyte',
    name: 'Lyte — Command Center Dashboard',
    url: `${BASE_URL}/lyte-command-center/dashboard`,
    filename: 'lyte-dashboard.jpg',
    viewport: { width: 1440, height: 900 },
    waitFor: '[data-dashboard], .dashboard, main',
  },
  {
    product: 'firestorm',
    name: 'Aegis — Defense Intelligence Landing',
    url: `${BASE_URL}/firestorm/`,
    filename: 'aegis-landing.jpg',
    viewport: { width: 1440, height: 900 },
    waitFor: 'h1, nav',
  },
  {
    product: 'firestorm',
    name: 'Aegis — SOC Command Center',
    url: `${BASE_URL}/firestorm/dashboard`,
    filename: 'aegis-overview.jpg',
    viewport: { width: 1440, height: 900 },
    waitFor: 'main, [data-dashboard]',
  },
  {
    product: 'vessels',
    name: 'Vessels — Fleet Command Landing',
    url: `${BASE_URL}/vessels/`,
    filename: 'vessels-landing.jpg',
    viewport: { width: 1440, height: 900 },
    waitFor: 'h1, nav',
  },
  {
    product: 'vessels',
    name: 'Vessels — Fleet Dashboard',
    url: `${BASE_URL}/vessels/fleet`,
    filename: 'vessels-overview.jpg',
    viewport: { width: 1440, height: 900 },
    waitFor: 'main, table',
  },
  {
    product: 'terra',
    name: 'Terra — Real Estate Intelligence',
    url: `${BASE_URL}/terra/`,
    filename: 'terra-landing.jpg',
    viewport: { width: 1440, height: 900 },
    waitFor: 'h1, nav',
  },
  {
    product: 'szl-holdings',
    name: 'SZL Holdings — Trust Center',
    url: `${BASE_URL}/trust`,
    filename: 'trust-center.jpg',
    viewport: { width: 1440, height: 900 },
    waitFor: 'main, h1',
  },
  {
    product: 'szl-holdings',
    name: 'SZL Holdings — Mobile Hero',
    url: `${BASE_URL}/`,
    filename: 'mobile-narrow-hero.jpg',
    viewport: { width: 390, height: 844 },
    waitFor: 'h1, nav',
  },
];

async function captureScreenshots() {
  let playwright: typeof import('playwright');
  try {
    playwright = await import('playwright');
  } catch {
    console.error('Playwright not installed. Run: npx playwright install chromium');
    process.exit(1);
  }

  const targets = PRODUCT_FILTER ? TARGETS.filter((t) => t.product === PRODUCT_FILTER) : TARGETS;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const results: { name: string; status: 'ok' | 'error'; file?: string; error?: string }[] = [];

  for (const target of targets) {
    console.log(`Capturing: ${target.name}`);

    try {
      const context = await browser.newContext({
        viewport: target.viewport,
        colorScheme: 'dark',
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 30000 });

      if (target.waitFor) {
        try {
          await page.waitForSelector(target.waitFor, { timeout: 5000 });
        } catch {
          // proceed anyway
        }
      }

      await page.waitForTimeout(1500);

      const outputPath = path.join(OUTPUT_DIR, target.filename);
      const screenshotOptions: Parameters<typeof page.screenshot>[0] = {
        path: outputPath,
        type: 'jpeg',
        quality: 90,
        fullPage: false,
      };

      if (target.clip) {
        screenshotOptions.clip = target.clip;
      }

      await page.screenshot(screenshotOptions);
      await context.close();

      results.push({ name: target.name, status: 'ok', file: outputPath });
      console.log(`  Saved: ${outputPath}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name: target.name, status: 'error', error: message });
      console.error(`  Failed: ${message}`);
    }
  }

  await browser.close();

  console.log('\n=== Screenshot Capture Summary ===');
  const succeeded = results.filter((r) => r.status === 'ok');
  const failed = results.filter((r) => r.status === 'error');
  console.log(`Captured: ${succeeded.length}/${targets.length}`);
  if (failed.length > 0) {
    console.log('Failed:');
    failed.forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
  }
}

captureScreenshots().catch(console.error);
