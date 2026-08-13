#!/usr/bin/env node
/**
 * SZL Holdings — Proof-Grade Screenshot Capture Script
 *
 * Captures proof screenshots across A11oy surfaces and other configured
 * artifacts. The canonical output is docs/assets/screenshots/current/.
 * Set SCREENSHOT_WRITE_MIRRORS=1 to also write public/proof/current/ and
 * audit/screenshots/raw/ mirrors.
 *
 * Usage:
 *   node scripts/capture-proof-screenshots.mjs
 *   node scripts/capture-proof-screenshots.mjs --filter a11oy
 *   node scripts/capture-proof-screenshots.mjs --dry-run
 *
 * The script waits for:
 *   1. networkidle (no network requests for 500ms)
 *   2. a route-local readySelector, or the legacy body hook for legacy targets
 *   3. Per-target configurable delay
 *
 * Fails closed:
 *   - If a target cannot be reached, the failure reason is recorded in the
 *     manifest and the script continues to the next target.
 *   - If a readiness selector or legacy hook times out, the capture is
 *     recorded as FAIL — no image is written. This prevents misleading
 *     screenshots of partially-loaded UI being used as proof material.
 *   - No placeholder images are ever substituted.
 *
 * npm script: pnpm screenshots:proof
 */

import { chromium } from '@playwright/test';
import { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// ── Viewport definitions ──────────────────────────────────────────────────────
// All five required viewports. Every target captures all five unless the target
// overrides with a `viewports` array (used only for variants like mobile where
// some formats are not meaningful).

const VIEWPORTS = {
  mobile_320: { width: 320, height: 900, label: 'mobile-320' },
  mobile_390: { width: 390, height: 900, label: 'mobile-390' },
  tablet_768: { width: 768, height: 1024, label: 'tablet-768' },
  desktop_1366: { width: 1366, height: 900, label: 'desktop-1366' },
  wide_1728: { width: 1728, height: 1000, label: 'wide-1728' },
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

const CAPTURE_DATE = process.env.SCREENSHOT_CAPTURE_DATE ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(CAPTURE_DATE)) {
  throw new Error(`SCREENSHOT_CAPTURE_DATE must be YYYY-MM-DD; received ${CAPTURE_DATE}`);
}

// ── Target definitions ────────────────────────────────────────────────────────
// Targets are defined in scripts/screenshot-targets.json (the canonical source).
// This script reads from that file and applies the DATE_SUFFIX at runtime.
// To add or modify targets, edit screenshot-targets.json — do not hardcode here.

const TARGETS = JSON.parse(readFileSync(join(__dirname, 'screenshot-targets.json'), 'utf8'));

// ── Output directories ────────────────────────────────────────────────────────

const CANONICAL_OUTPUT_DIR = join(REPO_ROOT, 'docs', 'assets', 'screenshots', 'current');
const OUTPUT_DIRS =
  process.env.SCREENSHOT_WRITE_MIRRORS === '1'
    ? [
        join(REPO_ROOT, 'public', 'proof', 'current'),
        CANONICAL_OUTPUT_DIR,
        join(REPO_ROOT, 'audit', 'screenshots', 'raw'),
      ]
    : [CANONICAL_OUTPUT_DIR];

// ── Argument parsing ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const filterEquals = args.find((arg) => arg.startsWith('--filter='));
const filterIndex = args.indexOf('--filter');
const FILTER =
  filterEquals?.slice('--filter='.length) ??
  (filterIndex >= 0 ? args[filterIndex + 1] : undefined) ??
  args.find((arg) => !arg.startsWith('--')) ??
  '';
const DRY_RUN = args.includes('--dry-run');

if (!FILTER && !DRY_RUN) {
  throw new Error(
    'Proof capture requires an explicit --filter or --filter=<safe-group>; unqualified legacy targets are not captured by default.',
  );
}

// ── Chromium resolution ───────────────────────────────────────────────────────

function resolveChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH;

  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const cacheRoot = join(process.env.LOCALAPPDATA, 'ms-playwright');
    if (existsSync(cacheRoot)) {
      const installs = readdirSync(cacheRoot)
        .filter((name) => /^chromium(?:_headless_shell)?-\d+$/.test(name))
        .sort((left, right) => Number(right.match(/\d+$/)?.[0]) - Number(left.match(/\d+$/)?.[0]));
      for (const install of installs) {
        const executable = install.startsWith('chromium_headless_shell-')
          ? join(cacheRoot, install, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe')
          : join(cacheRoot, install, 'chrome-win64', 'chrome.exe');
        if (existsSync(executable)) return executable;
      }
    }
  }

  const commands =
    process.platform === 'win32'
      ? ['where.exe chrome', 'where.exe msedge', 'where.exe chromium']
      : ['which chromium', 'which chromium-browser', 'which google-chrome'];
  for (const command of commands) {
    try {
      const p = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        .split(/\r?\n/)
        .find(Boolean);
      if (p) return p.trim();
    } catch {}
  }
  return undefined;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function hideReplitOverlays(page) {
  return page.evaluate(() => {
    const hide = (el) => {
      if (el) el.style.display = 'none';
    };
    [
      '[data-replit-banner]',
      '#replit-badge',
      '.replit-ui-theme-root > [style*="position: fixed"]',
    ].forEach((sel) => document.querySelectorAll(sel).forEach(hide));
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
 * Wait for a route-local readiness selector. Legacy targets without one wait
 * for a rendered root and still pass through the fail-closed error checks.
 *
 * FAIL-CLOSED: if the hook times out, throws an Error. The caller catches this
 * and records the capture as FAIL — no image is written. This prevents
 * partially-loaded or unready UI from being used as proof material.
 *
 * Called when a target declares readySelector or screenshotReadyHook.
 */
async function waitForScreenshotReady(page, target, timeout = 12000) {
  if (target.readySelector) {
    await page.locator(target.readySelector).waitFor({ state: 'visible', timeout });
    return;
  }
  await page.locator('#root > *').first().waitFor({ state: 'visible', timeout });
}

// ── Main ──────────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ??
  (process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:80');

function filenameFor(target, viewport) {
  const extension = target.format === 'jpeg' ? 'jpg' : 'png';
  return `${target.fileBase}-${viewport.label}-${CAPTURE_DATE}.${extension}`;
}

function gitValue(args) {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const targets = FILTER
  ? TARGETS.filter(
      (t) =>
        t.id.includes(FILTER) ||
        t.route.includes(FILTER) ||
        (Array.isArray(t.groups) && t.groups.includes(FILTER)),
    )
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
  captureDate: CAPTURE_DATE,
  baseUrl: BASE_URL,
  gitHead: gitValue(['rev-parse', 'HEAD']),
  gitTree: gitValue(['rev-parse', 'HEAD^{tree}']),
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
        filename: filenameFor(target, vp),
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
manifest.browserExecutable = executablePath ?? 'Playwright-managed Chromium';
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
    if (!vp) throw new Error(`Unknown viewport ${vpKey} for target ${target.id}`);
    const filename = filenameFor(target, vp);
    const entry = {
      id: `${target.id}--${vp.label}`,
      filename,
      route: target.route,
      viewport: vp,
      deviceScaleFactor: target.deviceScaleFactor ?? 2,
      encodedDimensions: {
        width: vp.width * (target.deviceScaleFactor ?? 2),
        height: target.fullPage ? null : vp.height * (target.deviceScaleFactor ?? 2),
      },
      capturedAt: null,
      caption: target.caption,
      proofClaim: target.proofClaim,
      qualityStatus: 'fail',
      notes: '',
      recommendedUsage: target.recommendedUsage,
    };

    let context;
    try {
      const requestedUrl = new URL(target.route, BASE_URL);
      if (
        target.sourceLocalOnly &&
        !['127.0.0.1', 'localhost', '::1'].includes(requestedUrl.hostname)
      ) {
        throw new Error(`Source-local target cannot be captured from ${requestedUrl.origin}`);
      }

      context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: target.deviceScaleFactor ?? 2,
        colorScheme: 'dark',
      });

      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      const resourceErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          const location = message.location();
          consoleErrors.push(
            `${message.text()}${location.url ? ` @ ${location.url}:${location.lineNumber ?? 0}` : ''}`,
          );
        }
      });
      page.on('pageerror', (error) => pageErrors.push(String(error)));
      page.on('response', (response) => {
        if (response.status() >= 400) resourceErrors.push(`${response.status()} ${response.url()}`);
      });
      page.on('requestfailed', (request) => {
        resourceErrors.push(`${request.failure()?.errorText ?? 'request failed'} ${request.url()}`);
      });

      const response = await page.goto(requestedUrl.href, {
        waitUntil: 'networkidle',
        timeout: 45000,
      });
      if (!response?.ok()) {
        throw new Error(
          `Navigation failed: ${response?.status() ?? 'no response'} ${requestedUrl.href}`,
        );
      }

      const normalizePath = (value) => value.replace(/\/+$/, '') || '/';
      if (normalizePath(new URL(page.url()).pathname) !== normalizePath(requestedUrl.pathname)) {
        throw new Error(`Unexpected final route: ${page.url()}`);
      }
      entry.finalUrl = page.url();

      if (target.readySelector || target.screenshotReadyHook) {
        await waitForScreenshotReady(page, target, 12000);
      }

      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map(
            (image) =>
              image.complete ||
              new Promise((resolve, reject) => {
                image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', reject, { once: true });
              }),
          ),
        );
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      await page.waitForTimeout(target.delay ?? 300);
      await hideReplitOverlays(page);
      await page.waitForTimeout(100);

      const inspection = await page.evaluate(() => {
        const overlay = [
          'vite-error-overlay',
          'react-error-overlay',
          '[data-vite-dev-id][role="dialog"]',
        ].some((selector) => document.querySelector(selector));
        const bodyText = document.body?.innerText ?? '';
        const visibleLoading = [
          ...document.querySelectorAll('[aria-busy="true"], .skeleton, .spinner'),
        ].some((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            rect.width > 0 &&
            rect.height > 0
          );
        });
        return {
          overlay,
          visibleLoading,
          missingPage: /(?:^|\n)404(?:\n|$)|page not found/i.test(bodyText),
          horizontalOverflow:
            document.documentElement.scrollWidth > document.documentElement.clientWidth,
          fullPageHeight: Math.max(
            document.body?.scrollHeight ?? 0,
            document.documentElement.scrollHeight,
          ),
        };
      });

      if (pageErrors.length > 0) throw new Error(`Page error: ${pageErrors.join(' | ')}`);
      if (resourceErrors.length > 0)
        throw new Error(`Resource error: ${resourceErrors.join(' | ')}`);
      if (consoleErrors.length > 0) throw new Error(`Console error: ${consoleErrors.join(' | ')}`);
      if (inspection.overlay) throw new Error('Runtime error overlay is present');
      if (inspection.visibleLoading)
        throw new Error('Visible loading or skeleton state is present');
      if (inspection.missingPage) throw new Error('404 or page-not-found content is present');
      if (target.sourceLocalOnly && inspection.horizontalOverflow) {
        throw new Error(`Horizontal overflow detected at ${vp.width} CSS pixels`);
      }

      if (target.fullPage) {
        entry.encodedDimensions.height =
          inspection.fullPageHeight * (target.deviceScaleFactor ?? 2);
      }

      const image = await page.screenshot({
        fullPage: target.fullPage ?? false,
        type: target.format === 'jpeg' ? 'jpeg' : 'png',
        ...(target.format === 'jpeg' ? { quality: 90 } : {}),
      });
      for (const dir of OUTPUT_DIRS) writeFileSync(join(dir, filename), image);

      entry.capturedAt = new Date().toISOString();
      entry.imageSha256 = createHash('sha256').update(image).digest('hex');
      entry.readySelector = target.readySelector ?? '#root > *';
      entry.qualityStatus = 'pass';
      entry.notes = 'Clean fail-closed local capture';
      passed++;
      console.log(`  ✓ ${filename}`);

      await page.close();
    } catch (err) {
      entry.qualityStatus = 'fail';
      const reason = String(err).slice(0, 300);
      entry.notes =
        (target.readySelector || target.screenshotReadyHook) && reason.includes('Timeout')
          ? `Fail-closed: readiness contract timed out — page not ready for proof capture. ${reason}`
          : `Capture failed: ${reason}`;
      failed++;
      console.warn(`  ✗ ${filename} — ${entry.notes.slice(0, 100)}`);
    } finally {
      await context?.close();
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
  const jsonPath = join(
    REPO_ROOT,
    'docs',
    'assets',
    'screenshots',
    'current',
    'screenshot-manifest.json',
  );
  const mdPath = join(
    REPO_ROOT,
    'docs',
    'assets',
    'screenshots',
    'current',
    'screenshot-manifest.md',
  );

  writeFileSync(jsonPath, JSON.stringify(manifest, null, 2));
  writeFileSync(mdPath, buildMarkdownManifest(manifest));
  console.log(`  Manifest written: ${jsonPath}`);
}

function buildMarkdownManifest(manifest) {
  const rows = manifest.results
    .map((r) => {
      const status =
        r.qualityStatus === 'pass'
          ? '✅ pass'
          : r.qualityStatus === 'warning'
            ? '⚠️ warning'
            : r.qualityStatus === 'pending'
              ? '⏳ pending'
              : '❌ fail';
      const usage = Array.isArray(r.recommendedUsage)
        ? r.recommendedUsage.join(', ')
        : r.recommendedUsage;
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
