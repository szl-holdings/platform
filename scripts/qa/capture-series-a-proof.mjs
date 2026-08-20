#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from '@playwright/test';

const VIEWPORTS = [
  { id: '320', width: 320, height: 900 },
  { id: '390', width: 390, height: 900 },
  { id: '768', width: 768, height: 1024 },
  { id: '1366', width: 1366, height: 900 },
  { id: '1728', width: 1728, height: 1000 },
];

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function requireSha(name) {
  const value = requiredEnvironment(name).toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(`${name} must be a full Git SHA`);
  return value;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

function normalizedRelative(root, target) {
  return path.relative(root, target).replaceAll(path.sep, '/');
}

const repository = requiredEnvironment('SOURCE_REPOSITORY');
const sourceSha = requireSha('SOURCE_SHA');
const sourceTreeSha = requireSha('SOURCE_TREE_SHA');
const sourceRef = requiredEnvironment('SOURCE_REF');
const workflowRunId = requiredEnvironment('WORKFLOW_RUN_ID');
const workflowRunAttempt = requiredEnvironment('WORKFLOW_RUN_ATTEMPT');
const baseUrl = new URL(requiredEnvironment('PLAYWRIGHT_BASE_URL'));
const captureRoute = process.env.CAPTURE_ROUTE?.trim() || '/a11oy/start';
if (!captureRoute.startsWith('/')) throw new Error('CAPTURE_ROUTE must be an absolute path');

const outputDirectory = path.resolve(
  process.env.PROOF_OUTPUT_DIR?.trim() || 'artifacts/series-a-screenshot-proof',
);
await mkdir(outputDirectory, { recursive: true });

const startedAt = new Date().toISOString();
const captureDate = startedAt.slice(0, 10);
const targetUrl = new URL(captureRoute, baseUrl).href;
const results = [];
let browser;

try {
  browser = await chromium.launch({
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const apiRequests = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('request', (request) => {
      const requestUrl = new URL(request.url());
      if (requestUrl.origin === baseUrl.origin && requestUrl.pathname.startsWith('/api/')) {
        apiRequests.push(`${request.method()} ${requestUrl.pathname}`);
      }
    });

    await page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
    );
    await page.route('https://fonts.gstatic.com/**', (route) => route.abort('blockedbyclient'));

    const filename = `a11oy-series-a-${viewport.id}-${captureDate}.png`;
    const filePath = path.join(outputDirectory, filename);
    const capturedAt = new Date().toISOString();

    try {
      const response = await page.goto(targetUrl, {
        waitUntil: 'networkidle',
        timeout: 45_000,
      });
      if (!response || response.status() >= 400) {
        throw new Error(`route returned HTTP ${response?.status() ?? 'NO_RESPONSE'}`);
      }

      await page.getByRole('heading', { name: /Series A Decision System/i }).waitFor({
        state: 'visible',
        timeout: 15_000,
      });

      const tabs = page.getByRole('tab');
      const tabCount = await tabs.count();
      if (tabCount !== 6) throw new Error(`expected 6 tabs, found ${tabCount}`);

      for (let index = 0; index < tabCount; index += 1) {
        await tabs.nth(index).click();
        if ((await tabs.nth(index).getAttribute('aria-selected')) !== 'true') {
          throw new Error(`tab ${index + 1} did not become selected`);
        }
        if ((await page.locator('[role="tabpanel"]:visible').count()) !== 1) {
          throw new Error(`tab ${index + 1} did not expose exactly one panel`);
        }
      }
      await tabs.first().click();

      const layout = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        documentHeight: document.documentElement.scrollHeight,
        readyState: document.readyState,
      }));
      if (layout.documentWidth > layout.viewportWidth + 1) {
        throw new Error(
          `horizontal overflow: document=${layout.documentWidth}, viewport=${layout.viewportWidth}`,
        );
      }
      if (layout.readyState !== 'complete')
        throw new Error(`document state is ${layout.readyState}`);
      if (consoleErrors.length > 0) throw new Error(`console errors: ${consoleErrors.join(' | ')}`);
      if (pageErrors.length > 0) throw new Error(`page errors: ${pageErrors.join(' | ')}`);
      if (apiRequests.length > 0)
        throw new Error(`unexpected API requests: ${apiRequests.join(' | ')}`);

      await page.screenshot({
        path: filePath,
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
      });
      const bytes = await readFile(filePath);
      results.push({
        status: 'PASS',
        filename,
        path: normalizedRelative(outputDirectory, filePath),
        route: captureRoute,
        captured_at: capturedAt,
        viewport_css_px: { width: viewport.width, height: viewport.height },
        document_css_px: { width: layout.documentWidth, height: layout.documentHeight },
        sha256: sha256(bytes),
        assertions: {
          http_status: response.status(),
          heading_visible: true,
          tab_count: tabCount,
          all_tabs_exercised: true,
          horizontal_overflow: false,
          console_errors: 0,
          page_errors: 0,
          undeclared_api_requests: 0,
        },
      });
    } catch (error) {
      results.push({
        status: 'FAIL',
        filename,
        route: captureRoute,
        captured_at: capturedAt,
        viewport_css_px: { width: viewport.width, height: viewport.height },
        error: String(error),
        console_errors: consoleErrors,
        page_errors: pageErrors,
        api_requests: apiRequests,
      });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser?.close();
}

const failed = results.filter((result) => result.status !== 'PASS');
const metadata = {
  schema: 'szl.screenshot-proof/v1',
  captured_at: startedAt,
  completed_at: new Date().toISOString(),
  status: failed.length === 0 ? 'PASS' : 'FAIL',
  source: {
    repository,
    ref: sourceRef,
    sha: sourceSha,
    tree_sha: sourceTreeSha,
  },
  route: captureRoute,
  capture_environment: {
    provider: 'github-actions',
    workflow_name: 'Series A Screenshot Proof',
    workflow_path: '.github/workflows/series-a-screenshot-proof.yml',
    workflow_run_id: workflowRunId,
    workflow_run_attempt: workflowRunAttempt,
    workflow_run_url: `https://github.com/${repository}/actions/runs/${workflowRunId}`,
    runner_os: process.env.RUNNER_OS ?? 'unknown',
    runner_arch: process.env.RUNNER_ARCH ?? 'unknown',
    node_version: process.version,
    browser: { name: 'chromium', version: browser?.version() ?? 'unknown' },
    command: 'node scripts/qa/capture-series-a-proof.mjs',
    loopback_base_url: baseUrl.origin,
    external_font_policy: 'Google Fonts CSS replaced with an empty response; system fallback used',
  },
  summary: {
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
  },
  captures: results,
  non_claims: [
    'The captures prove presentation of the named source revision in GitHub Actions only.',
    'They do not prove deployment, production runtime, customer use, or external service parity.',
  ],
};

await writeFile(
  path.join(outputDirectory, 'capture-metadata.json'),
  `${JSON.stringify(metadata, null, 2)}\n`,
  'utf8',
);

if (failed.length > 0) {
  process.stderr.write(`Series A screenshot proof failed for ${failed.length} viewport(s).\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Series A screenshot proof captured ${results.length} viewports for ${sourceSha}.\n`,
  );
}
