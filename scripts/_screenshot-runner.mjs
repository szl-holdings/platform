/**
 * SZL Holdings Screenshot Runner
 * Node.js script driven by capture-screenshots.sh
 *
 * Uses Playwright to capture hero screenshots and key views for every artifact.
 * Output: media/screenshots/<artifact>/<view>.png at 1920×1080 px (deviceScaleFactor 2)
 */

import { chromium } from '@playwright/test';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const [, , BASE_URL, OUT_DIR, FILTER = ''] = process.argv;

// ── Artifact registry ────────────────────────────────────────────────────────
// Each entry: { id, path, label, views: [{ name, url_suffix, waitFor, delay }] }
const ARTIFACTS = [
  {
    id: 'szl-holdings',
    path: '/',
    label: 'SZL Holdings Dashboard',
    views: [
      { name: 'hero', suffix: '', delay: 3000 },
      { name: 'portfolio', suffix: '#portfolio', delay: 2000 },
    ],
  },
  {
    id: 'pulse',
    path: '/pulse/',
    label: 'Pulse — AI Executive Briefing',
    views: [
      { name: 'hero', suffix: '', delay: 3000 },
      { name: 'brief', suffix: '', delay: 5000 },
    ],
  },
  {
    id: 'sentra',
    path: '/sentra/',
    label: 'Sentra — Cyber Resilience Command',
    views: [
      { name: 'hero', suffix: '', delay: 3000 },
      { name: 'dashboard', suffix: '', delay: 5000 },
    ],
  },
  {
    id: 'lyte',
    path: '/lyte/',
    label: 'Lyte — Decision Intelligence',
    views: [
      { name: 'hero', suffix: '', delay: 3000 },
      { name: 'command', suffix: '', delay: 5000 },
    ],
  },
  {
    id: 'vessels',
    path: '/vessels/',
    label: 'Vessels Maritime Intelligence',
    views: [
      { name: 'hero', suffix: '', delay: 3000 },
      { name: 'fleet', suffix: '', delay: 5000 },
    ],
  },
  {
    id: 'terra',
    path: '/terra/',
    label: 'Terra — Real Estate Intelligence',
    views: [
      { name: 'hero', suffix: '', delay: 3000 },
      { name: 'portfolio', suffix: '', delay: 5000 },
    ],
  },
  {
    id: 'prism-counsel',
    path: '/prism-counsel/',
    label: 'PRISM Counsel — Legal Command',
    views: [
      { name: 'hero', suffix: '', delay: 3000 },
      { name: 'matters', suffix: '', delay: 5000 },
    ],
  },
  {
    id: 'counsel',
    path: '/counsel/',
    label: 'Counsel — Legal Matter Command',
    views: [
      { name: 'hero', suffix: '', delay: 3000 },
      { name: 'dashboard', suffix: '', delay: 5000 },
    ],
  },
  {
    id: 'aegis',
    path: '/aegis/',
    label: 'Aegis — Investor Pitch Deck',
    views: [
      { name: 'hero', suffix: '', delay: 3000 },
      { name: 'deck', suffix: '', delay: 4000 },
    ],
  },
  {
    id: 'command',
    path: '/command/',
    label: 'Unified Command',
    views: [
      { name: 'hero', suffix: '', delay: 12000 },
      { name: 'dashboard', suffix: '', delay: 12000 },
    ],
  },
  {
    id: 'szl-demo-video',
    path: '/szl-demo-video/',
    label: 'SZL Holdings — Governed Autonomy Demo',
    views: [
      { name: 'hero', suffix: '', delay: 4000 },
      { name: 'scene-reel', suffix: '', delay: 14000 },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
const targets = FILTER
  ? ARTIFACTS.filter((a) => a.id.includes(FILTER))
  : ARTIFACTS;

if (targets.length === 0) {
  console.error(`No artifacts match filter: "${FILTER}"`);
  process.exit(1);
}

console.log(`Capturing ${targets.length} artifact(s)…`);

// Prefer the system Nix chromium which has all required libs
let executablePath;
try {
  const p = execSync('which chromium 2>/dev/null', { encoding: 'utf8' }).trim();
  if (p) executablePath = p;
} catch {}

const browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});

for (const artifact of targets) {
  const artifactDir = join(OUT_DIR, artifact.id);
  if (!existsSync(artifactDir)) mkdirSync(artifactDir, { recursive: true });

  console.log(`\n  [${artifact.id}] ${artifact.label}`);

  for (const view of artifact.views) {
    const url = `${BASE_URL}${artifact.path}${view.suffix}`;
    const outPath = join(artifactDir, `${view.name}.png`);

    try {
      const page = await context.newPage();

      // Suppress non-critical console noise
      page.on('console', () => {});
      page.on('pageerror', () => {});

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Allow animations / lazy-loaded content to settle
      await page.waitForTimeout(view.delay ?? 3000);

      // Dismiss cookie consent banners (decline so we don't track captures)
      try {
        const decline = page.getByRole('button', { name: /^(decline|reject|deny)/i }).first();
        if (await decline.isVisible({ timeout: 500 })) {
          await decline.click({ timeout: 1000 });
          await page.waitForTimeout(400);
        }
      } catch {}

      // Hide any Replit dev banners, overlays, or known floating chrome
      await page.evaluate(() => {
        const hide = (el) => { if (el) el.style.display = 'none'; };

        // Known selectors
        [
          '[data-replit-banner]',
          '#replit-badge',
          '.replit-ui-theme-root > [style*="position: fixed"]',
        ].forEach((sel) => document.querySelectorAll(sel).forEach(hide));

        // Heuristic: any fixed/sticky bar at the very top whose text mentions
        // the dev preview disclaimer ("temporary development preview", "Publish your app")
        const phrases = [
          'temporary development preview',
          'Publish your app',
        ];
        const candidates = Array.from(document.querySelectorAll('body *'));
        for (const el of candidates) {
          const cs = window.getComputedStyle(el);
          if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
          const top = parseFloat(cs.top || '0');
          if (Number.isFinite(top) && top > 80) continue;
          const text = (el.textContent || '').slice(0, 400);
          if (phrases.some((p) => text.includes(p))) hide(el);
        }
      });

      await page.waitForTimeout(300);

      await page.screenshot({ path: outPath, fullPage: false });
      await page.close();

      console.log(`    ✓ ${view.name}.png`);
    } catch (err) {
      console.error(`    ✗ ${view.name}: ${err.message}`);
    }
  }
}

await browser.close();
console.log('\nAll done.');
