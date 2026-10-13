import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Supplemental source-presentation captures. No live service, scanner, or effectful request.
const root = process.cwd();
const WITNESS_PATH = 'artifacts/a11oy/dist/cyber-boundary-build.json';
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
// Use Node's native module loader; Playwright transforms imported .mjs helpers.
const verifyWitness = () => JSON.parse(execFileSync(process.execPath,
  [path.join(root, 'scripts/qa/capture-cyber-build-witness.mjs'), '--verify'],
  { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const origin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3010').origin;
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)) {
  throw new Error('supplemental captures require the native localhost E2E server');
}
if ((process.env.A11OY_BASE_PATH ?? '/') !== '/') throw new Error('capture expects the native E2E / base');

const workflows = [
  { name: 'Alert Triage Agent', intent: 'Proposed workflow for organizing alerts and preparing an evidence bundle for a human reviewer.', gate: 'A reviewer would approve any escalation or external action.' },
  { name: 'Detection Engineering Agent', intent: 'Proposed workflow for drafting detection rules and testing them with synthetic data; no SIEM or EDR deployment occurs.', gate: 'A reviewer would approve any rule deployment.' },
  { name: 'Threat Analysis Agent', intent: 'Proposed workflow for analyzing suspicious files or URLs in an isolated test environment.', gate: 'A reviewer would approve any verdict or downstream action.' },
];
const targets = [
  ...workflows.map((workflow, index) => ({ slug: `workflow-${index + 1}`, route: '/security-agents', workflow })),
  { slug: 'cyber-resilience-hold', route: '/cyber-resilience', workflow: null },
  { slug: 'security-compliance-hold', route: '/security-compliance', workflow: null },
];
const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'portrait', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'full-hd', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 },
];
let witness: any;
test.beforeAll(async () => {
  witness = verifyWitness();
  expect(witness.workflow_run_id).toBe(process.env.GITHUB_RUN_ID ?? null);
  expect(witness.workflow_run_attempt).toBe(process.env.GITHUB_RUN_ATTEMPT ?? null);
});

for (const target of targets) {
  for (const viewport of viewports) {
    test(`${target.slug} preserves its evidence boundary at ${viewport.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      const errors: string[] = [];
      const requests: Array<{ method: string; path: string }> = [];
      const served: Array<{ path: string; file: string; sha256: string }> = [];
      const checks: Promise<void>[] = [];
      const fileFor = (url: URL) => url.pathname === target.route ? 'index.html' : decodeURIComponent(url.pathname).slice(1);
      await page.route('**/*', route => {
        const request = route.request();
        const url = new URL(request.url());
        const file = fileFor(url);
        requests.push({ method: request.method(), path: url.pathname });
        if (url.origin !== origin || url.search || !['GET', 'HEAD'].includes(request.method()) || !witness.output.files[file]) {
          errors.push(`refused unexpected request: ${request.method()} ${url.origin}${url.pathname}`);
          return route.abort();
        }
        return route.continue();
      });
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => {
        const check = (async () => {
          const url = new URL(response.url());
          const file = fileFor(url);
          const digest = sha256(await response.body());
          if (url.origin !== origin || response.status() !== 200 || digest !== witness.output.files[file]) {
            throw new Error(`served bytes differ from witnessed output: ${url.pathname}`);
          }
          served.push({ path: url.pathname, file, sha256: digest });
        })().catch(error => { errors.push(error.message); });
        checks.push(check);
      });
      const response = await page.goto(origin + target.route, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(origin + target.route);
      await expect(page.getByTestId('route-loader')).toHaveCount(0);
      const banner = page.getByTestId('candidate-boundary');
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('CANDIDATE DEMO:');
      await expect(banner).toContainText('No page establishes production operation, certification, external attestation, or durable signed proof.');
      if (target.workflow) {
        await expect(page.getByRole('heading', { level: 1, name: 'AI Security Operations', exact: true })).toBeVisible();
        await expect(page.getByTestId('publication-hold')).toHaveCount(0);
        await page.getByRole('button', { name: target.workflow.name, exact: true }).click();
        for (const workflow of workflows) {
          await expect(page.getByRole('button', { name: workflow.name, exact: true }))
            .toHaveAttribute('aria-pressed', String(workflow.name === target.workflow.name));
        }
        await expect(page.getByText(target.workflow.intent, { exact: true })).toBeVisible();
        await expect(page.getByText(`${target.workflow.gate} This is a design requirement; enforcement has not been verified on this page.`, { exact: true })).toBeVisible();
        for (const label of ['No runtime feed', 'No bound proof chain', 'No measured evaluation']) {
          await expect(page.getByText(label, { exact: true }).locator('..')).toContainText('UNAVAILABLE');
        }
        for (const gap of [
          'UNAVAILABLE — no source-bound runtime observation.',
          'UNAVAILABLE — no execution or target-system receipt.',
          'UNAVAILABLE — no verified receipt chain for these workflows.',
          'UNAVAILABLE — no current environment or approval evidence.',
        ]) await expect(page.getByText(gap, { exact: true })).toBeVisible();
        await expect(page.getByText('UNVERIFIED', { exact: true })).toHaveCount(4);
      } else {
        const hold = page.getByTestId('publication-hold');
        await expect(hold).toBeVisible();
        await expect(hold.getByRole('heading', { level: 1, name: 'Evidence review required before publication', exact: true })).toBeVisible();
        await expect(hold.getByText(target.route, { exact: true })).toBeVisible();
        await expect(hold).toContainText('This route is excluded from the public candidate.');
        await expect(hold).toContainText('dated sources, exact-head tests, and an approved evidence receipt');
        await expect(page.getByRole('heading', { name: /^(Cyber Resilience Center|Security and Compliance|AI Security Operations)$/ })).toHaveCount(0);
        for (const workflow of workflows) await expect(page.getByRole('button', { name: workflow.name, exact: true })).toHaveCount(0);
      }
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(layout.scroll).toBeLessThanOrEqual(layout.width + 1);
      const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
      await Promise.all(checks);
      expect(errors).toEqual([]);
      expect(served.some(row => row.file === 'index.html')).toBe(true);
      expect(served.some(row => row.file.startsWith('assets/'))).toBe(true);
      expect(verifyWitness()).toEqual(witness);
      const screenshot = testInfo.outputPath('cyber-boundary.png');
      const sidecar = testInfo.outputPath('cyber-boundary.json');
      await writeFile(screenshot, png);
      await writeFile(sidecar, JSON.stringify({
        schema: 'szl.supplemental-cyber-capture/v1', scope: 'source-presentation-only',
        source_sha: witness.source_sha, source_tree: witness.source_tree,
        build_manifest_sha256: witness.output.manifest_sha256,
        build_witness_sha256: sha256(await readFile(path.join(root, WITNESS_PATH))),
        workflow_run_id: process.env.GITHUB_RUN_ID ?? null,
        workflow_run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
        test_retry: testInfo.retry,
        capture_date: new Date().toISOString(), route: target.route, resolved_url: page.url(),
        selected_workflow: target.workflow?.name ?? null,
        expected_state: target.workflow ? 'MODELED/UNAVAILABLE' : 'PUBLICATION_HOLD',
        viewport, browser_version: page.context().browser()?.version(),
        screenshot_sha256: sha256(png), screenshot_bytes: png.length,
        requests, served_responses: served, console_or_page_errors: errors,
        qualification: 'Supplemental localhost browser evidence; not canonical-controller admission, deployment, certification, or operational security evidence.',
      }, null, 2) + '\n');
      await testInfo.attach('cyber-boundary-screenshot', { path: screenshot, contentType: 'image/png' });
      await testInfo.attach('cyber-boundary-source-binding', { path: sidecar, contentType: 'application/json' });
    });
  }
}
