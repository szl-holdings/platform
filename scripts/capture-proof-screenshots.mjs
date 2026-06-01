#!/usr/bin/env node
/**
 * SZL Holdings — Proof-Grade Screenshot Capture Script
 *
 * Captures investor-grade screenshots across A11oy surfaces and all
 * investor-facing artifacts at five viewport sizes. Writes to:
 *   - public/proof/current/
 *   - docs/assets/screenshots/current/
 *   - audit/screenshots/raw/
 *
 * Usage:
 *   node scripts/capture-proof-screenshots.mjs
 *   node scripts/capture-proof-screenshots.mjs --filter a11oy
 *   node scripts/capture-proof-screenshots.mjs --dry-run
 *
 * The script waits for:
 *   1. networkidle (no network requests for 500ms)
 *   2. document.body.dataset.screenshotReady === "true" (when screenshotReadyHook: true)
 *   3. Per-target configurable delay
 *
 * Fails closed:
 *   - If a target cannot be reached, the failure reason is recorded in the
 *     manifest and the script continues to the next target.
 *   - If screenshotReadyHook is true and the hook times out, the capture is
 *     recorded as FAIL — no image is written. This prevents misleading
 *     screenshots of partially-loaded UI being used as proof material.
 *   - No placeholder images are ever substituted.
 *
 * npm script: pnpm screenshots:proof
 */

import { chromium } from '@playwright/test';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// ── Viewport definitions ──────────────────────────────────────────────────────
// All five required viewports. Every target captures all five unless the target
// overrides with a `viewports` array (used only for variants like mobile where
// some formats are not meaningful).

const VIEWPORTS = {
  desktop: { width: 1440, height: 1000, label: 'desktop-1440' },
  wide: { width: 1600, height: 900, label: 'wide-1600' },
  social: { width: 1200, height: 630, label: 'social-1200' },
  linkedin_square: { width: 1080, height: 1080, label: 'linkedin-square-1080' },
  linkedin_portrait: { width: 1080, height: 1350, label: 'linkedin-portrait-1080' },
};

const ALL_VIEWPORTS = ['desktop', 'wide', 'social', 'linkedin_square', 'linkedin_portrait'];

// ── Target manifest ───────────────────────────────────────────────────────────
// Each target: route, id, filename (kebab + date suffix), caption, proofClaim,
// recommendedUsage, screenshotReadyHook flag, optional viewport override.
//
// All targets default to ALL_VIEWPORTS. Only use viewports override when a
// specific subset makes engineering sense (e.g. mobile shell only at desktop).

const DATE_SUFFIX = '2026-04';

// ── Target definitions ────────────────────────────────────────────────────────
// Targets are defined in scripts/screenshot-targets.json (the canonical source).
// This script reads from that file and applies the DATE_SUFFIX at runtime.
// To add or modify targets, edit screenshot-targets.json — do not hardcode here.

const TARGETS = JSON.parse(
  readFileSync(join(__dirname, 'screenshot-targets.json'), 'utf8')
).map((t) => ({
  ...t,
  filename: `${t.fileBase}-${DATE_SUFFIX}`,
}));


// ── Output directories ────────────────────────────────────────────────────────

const OUTPUT_DIRS = [
  join(REPO_ROOT, 'public', 'proof', 'current'),
  join(REPO_ROOT, 'docs', 'assets', 'screenshots', 'current'),
  join(REPO_ROOT, 'audit', 'screenshots', 'raw'),
];

// ── Argument parsing ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FILTER = args.find((a) => !a.startsWith('--'))?.replace('--filter=', '') ?? '';
const DRY_RUN = args.includes('--dry-run');

// ── Chromium resolution ───────────────────────────────────────────────────────

function resolveChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  try {
    const p = execSync('which chromium 2>/dev/null', { encoding: 'utf8' }).trim();
    if (p) return p;
  } catch {}
  return undefined;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function hideReplitOverlays(page) {
  return page.evaluate(() => {
    const hide = (el) => { if (el) el.style.display = 'none'; };
    ['[data-replit-banner]', '#replit-badge', '.replit-ui-theme-root > [style*="position: fixed"]']
      .forEach((sel) => document.querySelectorAll(sel).forEach(hide));
    const phrases = ['temporary development preview', 'Publish your app'];
    for (const el of document.querySelectorAll('body *')) {
      const cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      if (parseFloat(cs.top || '0') > 80) continue;
      if (phrases.some((p) => (el.textContent || '').slice(0, 400).includes(p))) hide(el);
    }
  });
}

/**
 * Wait for data-screenshot-ready="true" on document.body.
 *
 * FAIL-CLOSED: if the hook times out, throws an Error. The caller catches this
 * and records the capture as FAIL — no image is written. This prevents
 * partially-loaded or unready UI from being used as proof material.
 *
 * Only called when target.screenshotReadyHook === true.
 */
async function waitForScreenshotReady(page, timeout = 12000) {
  await page.waitForFunction(
    () => document.body?.dataset?.screenshotReady === 'true',
    { timeout }
  );
  // throws TimeoutError if not ready — intentionally not caught here
}

// ── Main ──────────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ??
  (process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:80');

const targets = FILTER
  ? TARGETS.filter((t) => t.id.includes(FILTER) || t.route.includes(FILTER))
  : TARGETS;

if (targets.length === 0) {
  console.error(`No targets match filter: ${FILTER}`);
  process.exit(1);
}

console.log(`\n  SZL Holdings — Proof Screenshot Capture`);
console.log(`  Base URL:  ${BASE_URL}`);
console.log(`  Targets:   ${targets.length}`);
console.log(`  Dry run:   ${DRY_RUN}`);
console.log();

OUTPUT_DIRS.forEach(ensureDir);

const manifest = {
  capturedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  dryRun: DRY_RUN,
  totalTargets: targets.length,
  results: [],
};

if (DRY_RUN) {
  for (const target of targets) {
    const vpKeys = target.viewports ?? ALL_VIEWPORTS;
    for (const vpKey of vpKeys) {
      const vp = VIEWPORTS[vpKey];
      manifest.results.push({
        id: `${target.id}--${vp.label}`,
        filename: `${target.filename}--${vp.label}.png`,
        route: target.route,
        viewport: vp,
        capturedAt: null,
        caption: target.caption,
        proofClaim: target.proofClaim,
        qualityStatus: 'pending',
        notes: 'Dry run — no capture performed',
        recommendedUsage: target.recommendedUsage,
      });
    }
  }
  writeManifestFiles(manifest);
  process.exit(0);
}

const executablePath = resolveChromium();
const browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

let passed = 0;
let failed = 0;

for (const target of targets) {
  const vpKeys = target.viewports ?? ALL_VIEWPORTS;

  for (const vpKey of vpKeys) {
    const vp = VIEWPORTS[vpKey];
    const filename = `${target.filename}--${vp.label}.png`;
    const entry = {
      id: `${target.id}--${vp.label}`,
      filename,
      route: target.route,
      viewport: vp,
      capturedAt: null,
      caption: target.caption,
      proofClaim: target.proofClaim,
      qualityStatus: 'fail',
      notes: '',
      recommendedUsage: target.recommendedUsage,
    };

    try {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        colorScheme: 'dark',
      });

      const page = await context.newPage();
      page.on('console', () => {});
      page.on('pageerror', (err) => {
        entry.notes += `console error: ${String(err).slice(0, 200)}; `;
      });

      const url = `${BASE_URL}${target.route}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

      if (target.screenshotReadyHook) {
        // Fail-closed: throws if data-screenshot-ready="true" is not set within timeout.
        // Caller (this try/catch) records FAIL and skips writing the image.
        await waitForScreenshotReady(page, 12000);
      }

      await page.waitForTimeout(target.delay ?? 3000);
      await hideReplitOverlays(page);
      await page.waitForTimeout(300);

      for (const dir of OUTPUT_DIRS) {
        const outPath = join(dir, filename);
        await page.screenshot({ path: outPath, fullPage: false });
      }

      entry.capturedAt = new Date().toISOString();
      entry.qualityStatus = entry.notes.includes('console error') ? 'warning' : 'pass';
      if (!entry.notes) entry.notes = 'Clean capture';
      passed++;
      console.log(`  ✓ ${filename}`);

      await page.close();
      await context.close();
    } catch (err) {
      entry.qualityStatus = 'fail';
      const reason = String(err).slice(0, 300);
      entry.notes = target.screenshotReadyHook && reason.includes('Timeout')
        ? `Fail-closed: data-screenshot-ready hook timed out — page not ready for proof capture. ${reason}`
        : `Capture failed: ${reason}`;
      failed++;
      console.warn(`  ✗ ${filename} — ${entry.notes.slice(0, 100)}`);
    }

    manifest.results.push(entry);
  }
}

await browser.close();

manifest.summary = { passed, failed, total: passed + failed };
writeManifestFiles(manifest);

console.log(`\n  Done. ${passed} passed, ${failed} failed.`);
console.log(`  Manifest: docs/assets/screenshots/current/screenshot-manifest.json\n`);

process.exit(failed > 0 ? 1 : 0);

// ── Manifest writers ──────────────────────────────────────────────────────────

function writeManifestFiles(manifest) {
  const jsonPath = join(REPO_ROOT, 'docs', 'assets', 'screenshots', 'current', 'screenshot-manifest.json');
  const mdPath = join(REPO_ROOT, 'docs', 'assets', 'screenshots', 'current', 'screenshot-manifest.md');

  writeFileSync(jsonPath, JSON.stringify(manifest, null, 2));
  writeFileSync(mdPath, buildMarkdownManifest(manifest));
  console.log(`  Manifest written: ${jsonPath}`);
}

function buildMarkdownManifest(manifest) {
  const rows = manifest.results
    .map((r) => {
      const status = r.qualityStatus === 'pass'
        ? '✅ pass'
        : r.qualityStatus === 'warning'
          ? '⚠️ warning'
          : r.qualityStatus === 'pending'
            ? '⏳ pending'
            : '❌ fail';
      const usage = Array.isArray(r.recommendedUsage) ? r.recommendedUsage.join(', ') : r.recommendedUsage;
      return `| \`${r.filename}\` | \`${r.route}\` | ${r.viewport.label} | ${r.capturedAt ?? '—'} | ${r.caption} | ${r.proofClaim} | ${status} | ${r.notes} | ${usage} |`;
    })
    .join('\n');

  const summary = manifest.summary
    ? `${manifest.summary.passed} passed, ${manifest.summary.failed} failed of ${manifest.summary.total}`
    : 'Dry run or pending';

  return `# Screenshot Manifest

**Generated:** ${manifest.capturedAt}
**Base URL:** ${manifest.baseUrl}
**Summary:** ${summary}

---

| Filename | Route | Viewport | Captured At | Caption | Proof Claim | Quality | Notes | Recommended Usage |
|----------|-------|----------|-------------|---------|-------------|---------|-------|-------------------|
${rows}
`;
}
