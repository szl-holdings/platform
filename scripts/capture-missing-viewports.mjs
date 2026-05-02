#!/usr/bin/env node
/**
 * Targeted capture for 3 A11oy routes that only have desktop captures.
 * Captures the 4 missing viewports for each route.
 */
import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';

const OUT_DIR = 'docs/assets/screenshots/current';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:80';
const DATE_SUFFIX = '2026-04';

function resolveChromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  try {
    const p = execSync('which chromium 2>/dev/null', { encoding: 'utf8' }).trim();
    return p || undefined;
  } catch { return undefined; }
}

const VIEWPORTS = [
  { id: 'wide-1600', width: 1600, height: 900 },
  { id: 'social-1200', width: 1200, height: 630 },
  { id: 'linkedin-square-1080', width: 1080, height: 1080 },
  { id: 'linkedin-portrait-1080', width: 1080, height: 1350 },
];

const MISSING = [
  { route: '/a11oy/workcells', filename: `a11oy-workcells-${DATE_SUFFIX}` },
  { route: '/a11oy/workcell-replay', filename: `a11oy-workcell-replay-${DATE_SUFFIX}` },
  { route: '/a11oy/investor-demo', filename: `a11oy-investor-demo-${DATE_SUFFIX}` },
];

async function waitForReady(page, timeout = 15000) {
  try {
    await page.waitForFunction(
      () => document.body?.dataset?.screenshotReady === 'true',
      { timeout }
    );
  } catch {
    throw new Error('screenshot-ready hook timed out');
  }
}

const executablePath = resolveChromiumPath();
console.log(`  Chromium: ${executablePath ?? 'playwright default'}`);
console.log(`  Base URL: ${BASE_URL}\n`);

const browser = await chromium.launch((executablePath ? { executablePath } : {}));
let captured = 0;
let failed = 0;

for (const target of MISSING) {
  for (const vp of VIEWPORTS) {
    const file = path.join(OUT_DIR, `${target.filename}--${vp.id}.png`);
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    try {
      await page.goto(`${BASE_URL}${target.route}`, { waitUntil: 'networkidle', timeout: 20000 });
      await waitForReady(page);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`  ✓  ${path.basename(file)}`);
      captured++;
    } catch (err) {
      console.error(`  ✗  ${path.basename(file)}: ${err.message}`);
      failed++;
    } finally {
      await page.close();
    }
  }
}

await browser.close();
console.log(`\nDone: ${captured} captured, ${failed} failed.`);
if (failed > 0) process.exit(1);
