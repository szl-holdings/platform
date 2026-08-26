#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

function requirePositiveInteger(name) {
  const value = requiredEnvironment(name);
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error(`${name} must be a positive integer`);
  return value;
}

function requireRepository(name) {
  const value = requiredEnvironment(name);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error(`${name} must identify one owner/repository`);
  }
  return value;
}

function requireWorkflowIdentity(repository) {
  const workflowRef = requiredEnvironment('GITHUB_WORKFLOW_REF');
  const prefix = `${repository}/`;
  const revisionSeparator = workflowRef.lastIndexOf('@');
  if (!workflowRef.startsWith(prefix) || revisionSeparator <= prefix.length) {
    throw new Error('GITHUB_WORKFLOW_REF must bind the current repository and workflow revision');
  }
  const workflowPath = workflowRef.slice(prefix.length, revisionSeparator);
  const workflowRevision = workflowRef.slice(revisionSeparator + 1);
  if (!/^\.github\/workflows\/[A-Za-z0-9._-]+\.ya?ml$/.test(workflowPath) || !workflowRevision) {
    throw new Error('GITHUB_WORKFLOW_REF must identify a repository workflow file');
  }
  return { workflowPath, workflowRef, workflowRevision };
}

function requireServerOrigin() {
  const serverUrl = new URL(requiredEnvironment('GITHUB_SERVER_URL'));
  if (
    serverUrl.protocol !== 'https:' ||
    serverUrl.username ||
    serverUrl.password ||
    serverUrl.pathname !== '/' ||
    serverUrl.search ||
    serverUrl.hash
  ) {
    throw new Error('GITHUB_SERVER_URL must be an absolute HTTPS origin');
  }
  return serverUrl.origin;
}

function captureProvenance(repository) {
  if (process.env.GITHUB_ACTIONS?.trim() !== 'true') {
    return Object.freeze({
      authority: 'LOCAL_NON_AUTHORITATIVE',
      provider: 'local',
      workflow_name: null,
      workflow_ref: null,
      workflow_path: null,
      workflow_revision: null,
      workflow_source_sha: null,
      workflow_run_id: null,
      workflow_run_attempt: null,
      workflow_run_url: null,
    });
  }

  const githubRepository = requireRepository('GITHUB_REPOSITORY');
  if (githubRepository !== repository) {
    throw new Error('GITHUB_REPOSITORY must match SOURCE_REPOSITORY');
  }
  const workflowName = requiredEnvironment('GITHUB_WORKFLOW');
  const { workflowPath, workflowRef, workflowRevision } = requireWorkflowIdentity(githubRepository);
  const workflowSourceSha = requireSha('GITHUB_WORKFLOW_SHA');
  const workflowRunId = requirePositiveInteger('GITHUB_RUN_ID');
  const workflowRunAttempt = requirePositiveInteger('GITHUB_RUN_ATTEMPT');
  const githubServerOrigin = requireServerOrigin();

  return Object.freeze({
    authority: 'VERIFIED_GITHUB_RUNTIME',
    provider: 'github-actions',
    workflow_name: workflowName,
    workflow_ref: workflowRef,
    workflow_path: workflowPath,
    workflow_revision: workflowRevision,
    workflow_source_sha: workflowSourceSha,
    workflow_run_id: workflowRunId,
    workflow_run_attempt: workflowRunAttempt,
    workflow_run_url:
      `${githubServerOrigin}/${githubRepository}/actions/runs/${workflowRunId}` +
      `/attempts/${workflowRunAttempt}`,
  });
}

function requireLoopbackBaseUrl() {
  const baseUrl = new URL(requiredEnvironment('PLAYWRIGHT_BASE_URL'));
  if (
    baseUrl.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost'].includes(baseUrl.hostname) ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new Error('PLAYWRIGHT_BASE_URL must be an uncredentialed HTTP loopback URL');
  }
  return baseUrl;
}

function requireCaptureRoute() {
  const route = process.env.CAPTURE_ROUTE?.trim() || '/a11oy/start';
  if (
    !/^\/a11oy(?:\/[A-Za-z0-9._~/-]*)?$/.test(route) ||
    route.includes('..') ||
    route.includes('//') ||
    route.includes('\\')
  ) {
    throw new Error('CAPTURE_ROUTE must be an origin-relative A11oy path');
  }
  return route;
}

function requireOutputDirectory(repositoryRoot) {
  const requested = process.env.PROOF_OUTPUT_DIR?.trim() || 'artifacts/series-a-screenshot-proof';
  const outputDirectory = path.resolve(repositoryRoot, requested);
  const relative = path.relative(repositoryRoot, outputDirectory);
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error('PROOF_OUTPUT_DIR must stay within the repository');
  }
  return outputDirectory;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

function normalizedRelative(root, target) {
  return path.relative(root, target).replaceAll(path.sep, '/');
}

function observeCheckoutIdentity() {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const treeSha = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {
    encoding: 'utf8',
  }).trim();
  const trackedStatus = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=no'], {
    encoding: 'utf8',
  }).trim();
  let branch = null;
  try {
    branch = execFileSync('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    branch = null;
  }
  return { branch, sha, trackedStatus, treeSha };
}

function verifyCheckoutIdentity(expectedSha, expectedTreeSha, phase) {
  const observed = observeCheckoutIdentity();
  if (observed.sha !== expectedSha) {
    throw new Error(`${phase} source ${observed.sha} does not match SOURCE_SHA`);
  }
  if (observed.treeSha !== expectedTreeSha) {
    throw new Error(`${phase} tree ${observed.treeSha} does not match SOURCE_TREE_SHA`);
  }
  if (observed.trackedStatus) {
    throw new Error(`tracked source changed ${phase}: ${observed.trackedStatus}`);
  }
  return observed;
}

const repository = requireRepository('SOURCE_REPOSITORY');
const sourceSha = requireSha('SOURCE_SHA');
const sourceTreeSha = requireSha('SOURCE_TREE_SHA');
const sourceRef = requiredEnvironment('SOURCE_REF');
const provenance = captureProvenance(repository);
const baseUrl = requireLoopbackBaseUrl();
const captureRoute = requireCaptureRoute();
const repositoryRoot = process.cwd();

const initialCheckout = verifyCheckoutIdentity(sourceSha, sourceTreeSha, 'before capture');
if (provenance.authority === 'LOCAL_NON_AUTHORITATIVE' && initialCheckout.branch !== sourceRef) {
  throw new Error('local SOURCE_REF must match the checked-out branch');
}

const outputDirectory = requireOutputDirectory(repositoryRoot);
await mkdir(outputDirectory, { recursive: true });

const startedAt = new Date().toISOString();
const captureDate = startedAt.slice(0, 10);
const targetUrl = new URL(captureRoute, baseUrl).href;
const results = [];
const { chromium } = await import('@playwright/test');
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

      await page.getByRole('heading', { name: /See the governed decision loop/i }).waitFor({
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

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForFunction(() => window.scrollX === 0 && window.scrollY === 0);
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
          }),
      );

      const layout = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        documentHeight: document.documentElement.scrollHeight,
        readyState: document.readyState,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      }));
      if (layout.scrollX !== 0 || layout.scrollY !== 0) {
        throw new Error(
          `capture must start at scroll origin, found (${layout.scrollX}, ${layout.scrollY})`,
        );
      }
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
          scroll_origin: true,
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

verifyCheckoutIdentity(sourceSha, sourceTreeSha, 'after capture');

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
    ...provenance,
    runner_os: process.env.RUNNER_OS ?? process.platform,
    runner_arch: process.env.RUNNER_ARCH ?? process.arch,
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
    provenance.authority === 'LOCAL_NON_AUTHORITATIVE'
      ? 'This local capture is non-authoritative and cannot satisfy hosted evidence gates alone.'
      : 'Hosted metadata is bound to the validated GitHub workflow runtime identity.',
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
