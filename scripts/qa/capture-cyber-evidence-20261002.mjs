#!/usr/bin/env node
/** Local source-presentation proof for the three A11oy cyber pages. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { chromium } from '@playwright/test';

const revision = process.env.SOURCE_REVISION ?? '';
if (!/^[0-9a-f]{40}$/.test(revision)) {
  throw new Error('SOURCE_REVISION must be an exact lowercase 40-character commit SHA');
}
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git('rev-parse', 'HEAD') !== revision) {
  throw new Error('checkout HEAD does not match SOURCE_REVISION');
}
for (const args of [
  ['diff', '--quiet', 'HEAD', '--', 'artifacts/a11oy/src'],
  ['diff', '--cached', '--quiet', '--', 'artifacts/a11oy/src'],
]) {
  execFileSync('git', args);
}

const baseUrl = 'http://127.0.0.1:4173';
const targets = [
  { slug: 'cyber-resilience', route: '/a11oy/cyber-resilience', heading: 'Cyber Resilience Center', marker: 'Modeled Check Categories' },
  { slug: 'governed-security-agents', route: '/a11oy/security-agents', heading: 'AI Security Operations', marker: 'UNAVAILABLE' },
  { slug: 'security-compliance', route: '/a11oy/security-compliance', heading: 'Security and Compliance', marker: 'Framework Evaluation Targets' },
];
const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'portrait', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'full-hd', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 },
];
const command = `$env:SOURCE_REVISION='${revision}'; node scripts/qa/capture-cyber-evidence-20261002.mjs`;
const playwrightPackage = JSON.parse(await readFile('node_modules/@playwright/test/package.json', 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const records = [];

try {
  for (const target of targets) {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
      });
      try {
        const page = await context.newPage();
        const consoleErrors = [];
        const pageErrors = [];
        page.on('console', message => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });
        page.on('pageerror', error => pageErrors.push(String(error)));
        const response = await page.goto(baseUrl + target.route, {
          waitUntil: 'domcontentloaded', timeout: 30_000,
        });
        await page.locator('h1').first().waitFor({ timeout: 20_000 });
        await page.waitForTimeout(500);
        const heading = (await page.locator('h1').first().textContent())?.trim();
        const body = await page.locator('body').innerText();
        const layout = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        if (response?.status() !== 200 || heading !== target.heading ||
            !body.includes(target.marker) || consoleErrors.length || pageErrors.length ||
            layout.scrollWidth > layout.clientWidth + 1) {
          throw new Error(JSON.stringify({
            route: target.route, viewport: viewport.name, http_status: response?.status(),
            heading, expected_heading: target.heading, marker_found: body.includes(target.marker),
            consoleErrors, pageErrors, layout,
          }));
        }
        const filename = `${target.slug}-${viewport.name}-2026-10-02.jpg`;
        const bytes = await page.screenshot({
          type: 'jpeg', quality: 90, fullPage: true, animations: 'disabled',
        });
        await mkdir('docs/assets/screenshots/current', { recursive: true });
        await writeFile(`docs/assets/screenshots/current/${filename}`, bytes);
        const record = {
          filename, route: target.route, surface: target.heading,
          capture_date: new Date().toISOString(), captured_by: 'Codex / local Playwright',
          capture_environment: 'local-exact-head', source_revision: revision,
          workflow_run_or_command: command, viewport: `${viewport.width} x ${viewport.height}`,
          artifact_sha256: createHash('sha256').update(bytes).digest('hex'),
          workcell_id: 'CYBER-EVIDENCE-2026-10-02', proof_level: 4, status: 'current',
          notes: 'Local source presentation only; not hosted CI, deployment, control operation, or certification.',
          resolved_url: page.url(), page_title: await page.title(), http_status: response.status(),
          console_error_count: consoleErrors.length, page_error_count: pageErrors.length,
          device_scale_factor: 1, byte_length: bytes.length,
        };
        records.push(record);
        process.stdout.write(`${filename} ${record.artifact_sha256}\n`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

await writeFile('audit/cyber-evidence-screenshots-2026-10-02.json', JSON.stringify({
  source_revision: revision,
  app_start_command: 'corepack pnpm --filter @workspace/a11oy exec vite preview --config vite.config.ts --host 127.0.0.1 --port 4173',
  capture_command: command,
  capture_environment: { os: `${os.platform()} ${os.release()}`, node: process.version,
    playwright: playwrightPackage.version, browser: 'Microsoft Edge', browser_version: browser.version() },
  records,
}, null, 2) + '\n');
