#!/usr/bin/env node
/** Capture three A11oy cyber pages from this process's own build and preview. */
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, statfs, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const revision = process.env.SOURCE_REVISION ?? '';
if (!/^[0-9a-f]{40}$/.test(revision)) {
  throw new Error('SOURCE_REVISION must be an exact lowercase 40-character commit SHA');
}
const root = process.cwd();
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
if (path.resolve(git('rev-parse', '--show-toplevel')).toLowerCase() !== path.resolve(root).toLowerCase()) {
  throw new Error('run the capture from the repository root');
}
const buildInputs = ['artifacts/a11oy', 'lib', 'packages', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'];
function assertBuildInputs() {
  if (git('rev-parse', 'HEAD') !== revision) throw new Error('checkout HEAD does not match SOURCE_REVISION');
  const dirty = git('status', '--porcelain=v1', '--untracked-files=all', '--', ...buildInputs);
  if (dirty) throw new Error(`A11oy build inputs differ from HEAD:\n${dirty}`);
}
async function assertFreeSpace() {
  const disk = await statfs(root);
  const free = Number(disk.bavail) * Number(disk.bsize);
  if (free < 1_500_000_000) throw new Error(`less than 1.5 GB free (${free} bytes); capture stopped`);
  return free;
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const captureScriptSha256 = sha256(await readFile(new URL(import.meta.url)));
assertBuildInputs();
await assertFreeSpace();

const appDir = path.join(root, 'artifacts/a11oy');
if ((await readdir(appDir)).some(name => /^\.env(?:\.|$)/.test(name))) {
  throw new Error('local A11oy .env file would make the build source-dependent');
}
const vite = path.join(appDir, 'node_modules/vite/bin/vite.js');
const dist = path.join(appDir, 'dist/public');
const buildEnv = { ...process.env, NODE_ENV: 'production', BASE_PATH: '/a11oy/' };
for (const key of Object.keys(buildEnv)) {
  if (key.startsWith('VITE_') || key === 'SHARED_PROXY_PORT') delete buildEnv[key];
}
const buildCommand = 'node artifacts/a11oy/node_modules/vite/bin/vite.js build --config vite.config.ts';
execFileSync(process.execPath, [vite, 'build', '--config', 'vite.config.ts'], {
  cwd: appDir, env: buildEnv, stdio: 'inherit', timeout: 180_000, windowsHide: true,
});
assertBuildInputs();
await assertFreeSpace();

async function filesUnder(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await filesUnder(path.join(directory, entry.name), name));
    else if (entry.isFile()) files.push(name);
  }
  return files;
}
const outputFiles = await filesUnder(dist);
if (!outputFiles.includes('index.html') || !outputFiles.some(name => name.startsWith('assets/'))) {
  throw new Error('Vite did not emit the expected A11oy application');
}
const outputHashes = new Map();
for (const filename of outputFiles) outputHashes.set(filename, sha256(await readFile(path.join(dist, filename))));
const buildManifest = [...outputHashes].sort(([a], [b]) => a.localeCompare(b))
  .map(([name, digest]) => `${name}\0${digest}\n`).join('');
const servedBuildSha256 = sha256(buildManifest);
const playwrightPackage = JSON.parse(await readFile('node_modules/@playwright/test/package.json', 'utf8'));

async function unusedPort() {
  const server = createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}
const port = await unusedPort();
const baseUrl = `http://127.0.0.1:${port}`;
const previewCommand = `node artifacts/a11oy/node_modules/vite/bin/vite.js preview --config vite.config.ts --host 127.0.0.1 --port ${port} --strictPort`;
const preview = spawn(process.execPath, [vite, 'preview', '--config', 'vite.config.ts',
  '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: appDir, env: buildEnv, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
let previewOutput = '';
let previewError;
preview.stdout.on('data', chunk => { previewOutput += chunk.toString(); });
preview.stderr.on('data', chunk => { previewOutput += chunk.toString(); });
preview.on('error', error => { previewError = error; });
function assertPreviewAlive() {
  if (previewError || preview.exitCode !== null || preview.signalCode !== null) {
    throw new Error(`owned Vite preview stopped: ${previewError ?? previewOutput}`);
  }
}
async function verifyIndex() {
  const response = await fetch(`${baseUrl}/a11oy/`, { signal: AbortSignal.timeout(1500) });
  if (response.status !== 200 || sha256(Buffer.from(await response.arrayBuffer())) !== outputHashes.get('index.html')) {
    throw new Error('served index.html differs from the fresh build');
  }
}
async function waitForPreview() {
  for (let attempt = 0; attempt < 100; attempt++) {
    assertPreviewAlive();
    if (previewOutput.includes(baseUrl)) {
      try {
        await verifyIndex();
        assertPreviewAlive();
        return;
      } catch { /* Startup can print the URL before it accepts connections. */ }
    }
    await delay(200);
  }
  throw new Error(`owned Vite preview did not serve the built index: ${previewOutput}`);
}
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
const records = [];
const images = new Map();
let browser;
let browserVersion;

try {
  await waitForPreview();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  browserVersion = browser.version();
  for (const target of targets) {
    for (const viewport of viewports) {
      assertPreviewAlive();
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
      });
      try {
        const page = await context.newPage();
        const consoleErrors = [];
        const pageErrors = [];
        const responseErrors = [];
        const responseChecks = [];
        let verifiedResponseCount = 0;
        await page.route('**/*', route => {
          if (new URL(route.request().url()).origin !== baseUrl) return route.abort();
          return route.continue();
        });
        page.on('console', message => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });
        page.on('pageerror', error => pageErrors.push(String(error)));
        page.on('response', response => {
          const check = (async () => {
            const url = new URL(response.url());
            if (url.origin !== baseUrl || response.status() !== 200) {
              throw new Error(`unexpected response ${response.status()} ${url}`);
            }
            const pathname = decodeURIComponent(url.pathname);
            const name = pathname === target.route ? 'index.html' :
              pathname.startsWith('/a11oy/') ? pathname.slice('/a11oy/'.length) : '';
            const expected = outputHashes.get(name);
            if (!expected || sha256(await response.body()) !== expected) {
              throw new Error(`served response differs from fresh build: ${url}`);
            }
            verifiedResponseCount++;
          })().catch(error => { responseErrors.push(String(error)); });
          responseChecks.push(check);
        });
        const response = await page.goto(baseUrl + target.route, {
          waitUntil: 'domcontentloaded', timeout: 30_000,
        });
        await page.locator('h1').first().waitFor({ timeout: 20_000 });
        await page.waitForTimeout(500);
        await Promise.all(responseChecks);
        const heading = (await page.locator('h1').first().textContent())?.trim();
        const body = await page.locator('body').innerText();
        const layout = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        if (response?.status() !== 200 || page.url() !== baseUrl + target.route ||
            heading !== target.heading || !body.includes(target.marker) ||
            consoleErrors.length || pageErrors.length || responseErrors.length ||
            verifiedResponseCount < 2 ||
            layout.scrollWidth > layout.clientWidth + 1) {
          throw new Error(JSON.stringify({
            route: target.route, viewport: viewport.name, http_status: response?.status(),
            heading, expected_heading: target.heading, marker_found: body.includes(target.marker),
            consoleErrors, pageErrors, responseErrors, verifiedResponseCount, layout,
          }));
        }
        const filename = `${target.slug}-${viewport.name}-2026-10-02.jpg`;
        const bytes = await page.screenshot({
          type: 'jpeg', quality: 90, fullPage: true, animations: 'disabled',
        });
        images.set(filename, bytes);
        const record = {
          filename, route: target.route, surface: target.heading,
          capture_date: new Date().toISOString(), captured_by: 'Codex / local Playwright',
          capture_environment: 'local-exact-head', source_revision: revision,
          workflow_run_or_command: command, viewport: `${viewport.width} x ${viewport.height}`,
          artifact_sha256: sha256(bytes), served_build_sha256: servedBuildSha256,
          workcell_id: 'CYBER-EVIDENCE-2026-10-02', proof_level: 4, status: 'current',
          notes: 'Local source presentation from a script-owned build and strict-port preview; not hosted CI, deployment, control operation, or certification.',
          resolved_url: page.url(), page_title: await page.title(), http_status: response.status(),
          console_error_count: consoleErrors.length, page_error_count: pageErrors.length,
          verified_response_count: verifiedResponseCount,
          device_scale_factor: 1, byte_length: bytes.length,
        };
        records.push(record);
        process.stdout.write(`${filename} ${record.artifact_sha256}\n`);
      } finally {
        await context.close();
      }
    }
  }
  assertBuildInputs();
  assertPreviewAlive();
  await verifyIndex();
  if (sha256(await readFile(new URL(import.meta.url))) !== captureScriptSha256) {
    throw new Error('capture script changed during the run');
  }
  await assertFreeSpace();
  await mkdir('docs/assets/screenshots/current', { recursive: true });
  for (const [filename, bytes] of images) {
    await writeFile(path.join('docs/assets/screenshots/current', filename), bytes);
  }
  await writeFile('audit/cyber-evidence-screenshots-2026-10-02.json', JSON.stringify({
    source_revision: revision,
    build_input_paths: buildInputs,
    build_inputs_clean_at_head: true,
    build_command: buildCommand,
    app_start_command: previewCommand,
    capture_script_sha256: captureScriptSha256,
    served_build_sha256: servedBuildSha256,
    served_index_sha256: outputHashes.get('index.html'),
    capture_command: command,
    capture_environment: { os: `${os.platform()} ${os.release()}`, node: process.version,
      playwright: playwrightPackage.version, browser: 'Microsoft Edge', browser_version: browserVersion },
    records,
  }, null, 2) + '\n');
} finally {
  if (browser) await browser.close();
  if (preview.exitCode === null && preview.signalCode === null) preview.kill();
}
