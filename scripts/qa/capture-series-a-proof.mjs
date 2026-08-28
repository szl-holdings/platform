#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  installCaptureNetworkPolicy,
  publishCaptureDirectory,
  requireOutputDirectory,
  requirePathAbsent,
  sha256,
} from './series-a-proof-helpers.mjs';

const VIEWPORTS = [
  { id: '320', width: 320, height: 900 },
  { id: '390', width: 390, height: 900 },
  { id: '768', width: 768, height: 1024 },
  { id: '1366', width: 1366, height: 900 },
  { id: '1728', width: 1728, height: 1000 },
];

const BUILD_BASE_PATH = '/a11oy/';
const EVIDENCE_STATES = ['REAL', 'DEMO', 'UNAVAILABLE', 'DEGRADED', 'BLOCKED', 'ROADMAP'];
const IDENTITY_PATH = '/__szl-series-a-proof__/identity.json';

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

function normalizedRelative(root, target) {
  return path.relative(root, target).replaceAll(path.sep, '/');
}

function runPnpm(args, options = {}) {
  const commonOptions = {
    cwd: options.cwd,
    encoding: options.encoding,
    env: options.env,
    stdio: options.stdio,
    windowsHide: true,
  };
  if (process.platform !== 'win32') {
    return execFileSync('pnpm', args, commonOptions);
  }

  if (args.some((argument) => !/^[A-Za-z0-9_./:@=-]+$/.test(argument))) {
    throw new Error('pnpm argument cannot be represented by the Windows evidence rail');
  }
  const commandProcessor = process.env.ComSpec || 'cmd.exe';
  const command = ['pnpm', ...args].join(' ');
  return execFileSync(commandProcessor, ['/d', '/s', '/c', command], commonOptions);
}

async function readBuildEntries(buildDirectory, currentDirectory = buildDirectory) {
  const entries = [];
  const directoryEntries = await readdir(currentDirectory, { withFileTypes: true });
  directoryEntries.sort((left, right) =>
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
  );

  for (const directoryEntry of directoryEntries) {
    const absolutePath = path.join(currentDirectory, directoryEntry.name);
    if (directoryEntry.isDirectory()) {
      entries.push(...(await readBuildEntries(buildDirectory, absolutePath)));
      continue;
    }
    if (!directoryEntry.isFile()) {
      throw new Error(`build output contains a non-regular entry: ${absolutePath}`);
    }
    const bytes = await readFile(absolutePath);
    entries.push({
      path: normalizedRelative(buildDirectory, absolutePath),
      size_bytes: bytes.byteLength,
      sha256: sha256(bytes),
      bytes,
    });
  }
  return entries;
}

async function snapshotBuild(buildDirectory) {
  const entries = await readBuildEntries(buildDirectory);
  if (entries.length === 0 || !entries.some((entry) => entry.path === 'index.html')) {
    throw new Error('A11oy build output must contain index.html and cannot be empty');
  }

  const manifest = entries.map(({ bytes: _bytes, ...entry }) => entry);
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest)}\n`);
  const indexEntry = entries.find((entry) => entry.path === 'index.html');
  return {
    files: new Map(entries.map((entry) => [entry.path, entry])),
    manifest,
    manifest_sha256: sha256(manifestBytes),
    index_html_sha256: indexEntry.sha256,
    file_count: entries.length,
    total_bytes: entries.reduce((total, entry) => total + entry.size_bytes, 0),
  };
}

async function buildExactSource(repositoryRoot) {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'a11oy-series-a-proof-'));
  const buildDirectory = path.join(temporaryRoot, 'public');
  const buildDirectoryArgument = buildDirectory.replaceAll(path.sep, '/');
  const buildArgs = [
    '--filter',
    '@workspace/a11oy',
    'exec',
    'vite',
    'build',
    '--base',
    BUILD_BASE_PATH,
    '--outDir',
    buildDirectoryArgument,
    '--emptyOutDir',
  ];
  const sanitizedEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) =>
        !name.startsWith('VITE_') &&
        !['A11OY_EVIDENCE_BUILD_DIR', 'BASE_PATH', 'CI', 'NODE_ENV', 'REPL_ID'].includes(name),
    ),
  );
  const buildEnvironment = {
    ...sanitizedEnvironment,
    NODE_ENV: 'production',
    BASE_PATH: BUILD_BASE_PATH,
    CI: 'true',
  };
  const startedAt = new Date().toISOString();

  try {
    const packageManifest = JSON.parse(
      await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
    );
    const pinnedPnpmVersion = String(packageManifest.packageManager ?? '').match(
      /^pnpm@(.+)$/,
    )?.[1];
    if (!pinnedPnpmVersion) {
      throw new Error('root package.json must pin packageManager to pnpm@<version>');
    }
    const pnpmVersion = String(
      runPnpm(['--version'], {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env: process.env,
      }),
    ).trim();
    if (pnpmVersion !== pinnedPnpmVersion) {
      throw new Error(`pnpm ${pnpmVersion} does not match repository pin ${pinnedPnpmVersion}`);
    }
    const viteVersion = String(
      runPnpm(['--filter', '@workspace/a11oy', 'exec', 'vite', '--version'], {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env: buildEnvironment,
      }),
    ).trim();
    const lockfileSha256 = sha256(await readFile(path.join(repositoryRoot, 'pnpm-lock.yaml')));
    runPnpm(buildArgs, {
      cwd: repositoryRoot,
      env: buildEnvironment,
      stdio: 'inherit',
    });
    const snapshot = await snapshotBuild(buildDirectory);
    return {
      ...snapshot,
      temporaryRoot,
      buildDirectory,
      command:
        'pnpm --filter @workspace/a11oy exec vite build --base /a11oy/ --outDir <ephemeral> --emptyOutDir',
      pnpm_version: pnpmVersion,
      pinned_pnpm_version: pinnedPnpmVersion,
      vite_version: viteVersion,
      lockfile_sha256: lockfileSha256,
      environment_policy:
        'production CI build; inherited VITE_*, evidence-output, and REPL_ID values removed; BASE_PATH fixed to /a11oy/; output is a rail-created temporary directory',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    };
  } catch (error) {
    await rm(temporaryRoot, { force: true, recursive: true });
    throw error;
  }
}

function contentTypeFor(relativePath) {
  const extension = path.posix.extname(relativePath).toLowerCase();
  return (
    {
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.ico': 'image/x-icon',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.svg': 'image/svg+xml; charset=utf-8',
      '.txt': 'text/plain; charset=utf-8',
      '.webp': 'image/webp',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
    }[extension] ?? 'application/octet-stream'
  );
}

async function startEvidenceServer(build, sourceSha, sourceTreeSha) {
  const nonce = randomBytes(32).toString('hex');
  let expectedHost = null;
  const server = createServer((request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method ?? '')) {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
      }

      if (!expectedHost || request.headers.host !== expectedHost) {
        response.writeHead(400);
        response.end();
        return;
      }

      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const pathname = decodeURIComponent(requestUrl.pathname);
      const identity = {
        source_sha: sourceSha,
        source_tree_sha: sourceTreeSha,
        build_manifest_sha256: build.manifest_sha256,
        base_path: BUILD_BASE_PATH,
        nonce,
      };
      const identityBytes = Buffer.from(`${JSON.stringify(identity)}\n`);
      const identityHeaders = {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-SZL-Build-Manifest-SHA256': build.manifest_sha256,
        'X-SZL-Proof-Nonce': nonce,
        'X-SZL-Source-SHA': sourceSha,
        'X-SZL-Source-Tree-SHA': sourceTreeSha,
      };
      if (pathname === IDENTITY_PATH) {
        response.writeHead(200, {
          ...identityHeaders,
          'Content-Length': identityBytes.byteLength,
          'Content-Type': 'application/json; charset=utf-8',
        });
        response.end(request.method === 'HEAD' ? undefined : identityBytes);
        return;
      }
      if (pathname === BUILD_BASE_PATH.slice(0, -1)) {
        response.writeHead(308, { Location: BUILD_BASE_PATH });
        response.end();
        return;
      }
      if (
        !pathname.startsWith(BUILD_BASE_PATH) ||
        pathname.includes('\\') ||
        pathname.includes('\0') ||
        pathname.includes('//') ||
        pathname.split('/').includes('..')
      ) {
        response.writeHead(404);
        response.end();
        return;
      }

      const requestedPath = pathname.slice(BUILD_BASE_PATH.length);
      const hasExtension = path.posix.extname(requestedPath) !== '';
      const selectedPath = build.files.has(requestedPath)
        ? requestedPath
        : hasExtension
          ? null
          : 'index.html';
      const entry = selectedPath ? build.files.get(selectedPath) : null;
      if (!entry) {
        response.writeHead(404);
        response.end();
        return;
      }

      response.writeHead(200, {
        ...identityHeaders,
        'Cache-Control': 'no-store',
        'Content-Length': entry.size_bytes,
        'Content-Type': contentTypeFor(entry.path),
      });
      response.end(request.method === 'HEAD' ? undefined : entry.bytes);
    } catch {
      response.writeHead(400);
      response.end();
    }
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string' || address.address !== '127.0.0.1') {
    server.close();
    throw new Error('evidence server did not bind an ephemeral IPv4 loopback port');
  }
  expectedHost = `127.0.0.1:${address.port}`;

  return {
    baseUrl: new URL(`http://127.0.0.1:${address.port}${BUILD_BASE_PATH}`),
    identityUrl: new URL(`http://127.0.0.1:${address.port}${IDENTITY_PATH}`),
    nonce,
    nonce_sha256: sha256(Buffer.from(nonce)),
    async close() {
      if (!server.listening) return;
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

function verifyServedIdentity(headers, sourceSha, sourceTreeSha, buildManifestSha, nonce) {
  const expected = {
    'x-szl-build-manifest-sha256': buildManifestSha,
    'x-szl-proof-nonce': nonce,
    'x-szl-source-sha': sourceSha,
    'x-szl-source-tree-sha': sourceTreeSha,
  };
  for (const [name, value] of Object.entries(expected)) {
    if (headers[name] !== value) {
      throw new Error(`served identity header ${name} did not match the evidence rail`);
    }
  }
}

function observeCheckoutIdentity() {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const treeSha = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {
    encoding: 'utf8',
  }).trim();
  const trackedStatus = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=no'], {
    encoding: 'utf8',
  }).trim();
  const untrackedEntries = execFileSync(
    'git',
    ['ls-files', '--others', '--exclude-standard', '--directory', '-z'],
    { encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);
  const ignoredEntries = execFileSync(
    'git',
    ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory', '-z'],
    { encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);
  const sourceInputs = [...untrackedEntries, ...ignoredEntries].filter(
    (entry) => !/(^|\/)node_modules\/$/.test(entry.replaceAll('\\', '/')),
  );
  let branch = null;
  try {
    branch = execFileSync('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    branch = null;
  }
  return { branch, sha, sourceInputs, trackedStatus, treeSha };
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
  if (observed.sourceInputs.length > 0) {
    throw new Error(
      `untracked or ignored source input exists ${phase}: ${observed.sourceInputs.join(', ')}`,
    );
  }
  return observed;
}

const repository = requireRepository('SOURCE_REPOSITORY');
const sourceSha = requireSha('SOURCE_SHA');
const sourceTreeSha = requireSha('SOURCE_TREE_SHA');
const sourceRef = requiredEnvironment('SOURCE_REF');
const provenance = captureProvenance(repository);
const captureRoute = requireCaptureRoute();
const repositoryRoot = process.cwd();

if (process.env.PLAYWRIGHT_BASE_URL?.trim()) {
  throw new Error('PLAYWRIGHT_BASE_URL is not accepted: the capture rail owns its server');
}

const initialCheckout = verifyCheckoutIdentity(sourceSha, sourceTreeSha, 'before capture');
if (provenance.authority === 'LOCAL_NON_AUTHORITATIVE' && initialCheckout.branch !== sourceRef) {
  throw new Error('local SOURCE_REF must match the checked-out branch');
}

const outputDirectory = requireOutputDirectory(repositoryRoot);
await requirePathAbsent(outputDirectory);
const startedAt = new Date().toISOString();
const captureDate = startedAt.slice(0, 10);
const results = [];
const { chromium } = await import('@playwright/test');
let browser;
let browserVersion = 'unknown';
let build;
let captureDirectory;
let evidenceServer;
let baseUrl;
let targetUrl;

try {
  build = await buildExactSource(repositoryRoot);
  verifyCheckoutIdentity(sourceSha, sourceTreeSha, 'after exact-source build');
  captureDirectory = path.join(build.temporaryRoot, 'captures');
  await mkdir(captureDirectory, { recursive: true });
  evidenceServer = await startEvidenceServer(build, sourceSha, sourceTreeSha);
  baseUrl = evidenceServer.baseUrl;
  targetUrl = new URL(captureRoute.replace(/^\/a11oy/, '').replace(/^\//, ''), baseUrl).href;

  const identityResponse = await fetch(evidenceServer.identityUrl, { cache: 'no-store' });
  if (!identityResponse.ok) {
    throw new Error(`evidence identity endpoint returned HTTP ${identityResponse.status}`);
  }
  const identityHeaders = Object.fromEntries(identityResponse.headers.entries());
  verifyServedIdentity(
    identityHeaders,
    sourceSha,
    sourceTreeSha,
    build.manifest_sha256,
    evidenceServer.nonce,
  );
  const identity = await identityResponse.json();
  if (
    identity.source_sha !== sourceSha ||
    identity.source_tree_sha !== sourceTreeSha ||
    identity.build_manifest_sha256 !== build.manifest_sha256 ||
    identity.base_path !== BUILD_BASE_PATH ||
    identity.nonce !== evidenceServer.nonce
  ) {
    throw new Error('evidence identity document did not match the verified build');
  }

  try {
    browser = await chromium.launch({
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
    browserVersion = browser.version();

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
        reducedMotion: 'reduce',
        serviceWorkers: 'block',
      });
      const consoleErrors = [];
      const pageErrors = [];
      const apiRequests = [];
      const { blockedNetworkRequests, stubbedFontRequests, webSocketRequests } =
        await installCaptureNetworkPolicy(context, baseUrl.origin);

      const page = await context.newPage();

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
      const filename = `a11oy-series-a-${viewport.id}-${captureDate}.png`;
      const filePath = path.join(captureDirectory, filename);
      const capturedAt = new Date().toISOString();

      try {
        const response = await page.goto(targetUrl, {
          waitUntil: 'networkidle',
          timeout: 45_000,
        });
        if (!response || response.status() >= 400) {
          throw new Error(`route returned HTTP ${response?.status() ?? 'NO_RESPONSE'}`);
        }
        const responseHeaders = await response.allHeaders();
        verifyServedIdentity(
          responseHeaders,
          sourceSha,
          sourceTreeSha,
          build.manifest_sha256,
          evidenceServer.nonce,
        );
        if (sha256(await response.body()) !== build.index_html_sha256) {
          throw new Error('served document bytes did not match the exact-build index.html');
        }

        await page.getByRole('heading', { name: /See the governed decision loop/i }).waitFor({
          state: 'visible',
          timeout: 15_000,
        });

        const stateLabels = await page.locator('#truth-vocabulary .sa-state').allTextContents();
        if (JSON.stringify(stateLabels) !== JSON.stringify(EVIDENCE_STATES)) {
          throw new Error(
            `expected six canonical evidence states, found ${stateLabels.join(', ')}`,
          );
        }
        const navigationBoundary = await page.locator('a[href]').evaluateAll((anchors) => {
          const hrefs = anchors.map((anchor) => anchor.getAttribute('href')).filter(Boolean);
          const outbound = hrefs.filter((href) => !href.startsWith('#'));
          const missingTargets = hrefs
            .filter((href) => href.startsWith('#'))
            .filter((href) => !document.getElementById(href.slice(1)));
          return { missingTargets, outbound };
        });
        if (navigationBoundary.outbound.length > 0) {
          throw new Error(
            `outbound Series A navigation: ${navigationBoundary.outbound.join(', ')}`,
          );
        }
        if (navigationBoundary.missingTargets.length > 0) {
          throw new Error(
            `missing fragment targets: ${navigationBoundary.missingTargets.join(', ')}`,
          );
        }
        const developerStepCount = await page.locator('#developer .sa-developer-card').count();
        if (developerStepCount !== 7) {
          throw new Error(`expected 7 developer steps, found ${developerStepCount}`);
        }
        const receiptFieldCount = await page.locator('#developer .sa-receipt-grid dt').count();
        if (receiptFieldCount !== 7) {
          throw new Error(`expected 7 receipt fields, found ${receiptFieldCount}`);
        }

        const tabs = page.getByRole('tab');
        const tabCount = await tabs.count();
        if (tabCount !== 6) throw new Error(`expected 6 tabs, found ${tabCount}`);

        const missingTabControls = await tabs.evaluateAll((tabElements) =>
          tabElements
            .map((tab) => tab.getAttribute('aria-controls'))
            .filter((id) => !id || !document.getElementById(id)),
        );
        if (missingTabControls.length > 0) {
          throw new Error(
            `expected every tab aria-controls target to exist: ${missingTabControls.join(', ')}`,
          );
        }

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

        const keyboardCases = [
          { key: 'ArrowRight', expectedIndex: 1 },
          { key: 'End', expectedIndex: 5 },
          { key: 'ArrowLeft', expectedIndex: 4 },
          { key: 'Home', expectedIndex: 0 },
        ];
        await tabs.first().focus();
        for (const keyboardCase of keyboardCases) {
          await page.keyboard.press(keyboardCase.key);
          const expectedTab = tabs.nth(keyboardCase.expectedIndex);
          const expectedTabId = await expectedTab.getAttribute('id');
          const expectedPanelId = await expectedTab.getAttribute('aria-controls');
          const keyboardState = await page.evaluate(() => ({
            activeElementId: document.activeElement?.id ?? null,
          }));
          if (
            keyboardState.activeElementId !== expectedTabId ||
            (await expectedTab.getAttribute('aria-selected')) !== 'true' ||
            (await page.locator('[role="tabpanel"]:visible').getAttribute('id')) !== expectedPanelId
          ) {
            throw new Error(`${keyboardCase.key} did not select and focus its controlled panel`);
          }
        }

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
        if (consoleErrors.length > 0)
          throw new Error(`console errors: ${consoleErrors.join(' | ')}`);
        if (pageErrors.length > 0) throw new Error(`page errors: ${pageErrors.join(' | ')}`);
        if (apiRequests.length > 0)
          throw new Error(`unexpected API requests: ${apiRequests.join(' | ')}`);
        if (blockedNetworkRequests.length > 0) {
          throw new Error(
            `unexpected foreign network requests: ${blockedNetworkRequests.join(' | ')}`,
          );
        }
        if (webSocketRequests.length > 0) {
          throw new Error(`unexpected WebSocket requests: ${webSocketRequests.join(' | ')}`);
        }

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
          path: filename,
          route: captureRoute,
          captured_at: capturedAt,
          viewport_css_px: { width: viewport.width, height: viewport.height },
          document_css_px: { width: layout.documentWidth, height: layout.documentHeight },
          sha256: sha256(bytes),
          assertions: {
            http_status: response.status(),
            served_build_identity: true,
            document_digest_verified: true,
            heading_visible: true,
            evidence_states: EVIDENCE_STATES.length,
            tab_count: tabCount,
            all_tabs_exercised: true,
            all_tab_controls_resolved: true,
            keyboard_navigation: true,
            developer_steps: developerStepCount,
            receipt_fields: receiptFieldCount,
            outbound_navigation: 0,
            missing_fragment_targets: 0,
            scroll_origin: true,
            horizontal_overflow: false,
            console_errors: 0,
            page_errors: 0,
            undeclared_api_requests: 0,
            foreign_network_requests: 0,
            websocket_requests: 0,
            service_workers_blocked: true,
            stubbed_font_requests: stubbedFontRequests.length,
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
          blocked_network_requests: blockedNetworkRequests,
          web_socket_requests: webSocketRequests,
        });
      } finally {
        await context.close();
      }
    }
  } finally {
    try {
      await browser?.close();
    } finally {
      await evidenceServer?.close();
    }
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
    build: {
      schema: 'szl.series-a-build/v1',
      package: '@workspace/a11oy',
      command: build.command,
      started_at: build.started_at,
      completed_at: build.completed_at,
      toolchain: {
        node: process.version,
        pnpm: build.pnpm_version,
        repository_pnpm_pin: build.pinned_pnpm_version,
        vite: build.vite_version,
        lockfile_sha256: build.lockfile_sha256,
      },
      environment_policy: build.environment_policy,
      assets: {
        base_path: BUILD_BASE_PATH,
        storage: 'ephemeral',
        manifest_algorithm: 'sha256(canonical-json-v1)',
        manifest_sha256: build.manifest_sha256,
        entry_document_sha256: build.index_html_sha256,
        file_count: build.file_count,
        total_bytes: build.total_bytes,
        files: build.manifest,
      },
    },
    server: {
      ownership: 'capture-rail',
      implementation: 'node:http immutable in-memory build snapshot',
      bind: '127.0.0.1',
      port_strategy: 'os-ephemeral',
      served_manifest_sha256: build.manifest_sha256,
      proof_nonce_sha256: evidenceServer.nonce_sha256,
      foreign_loopback_allowed: false,
      network_policy: {
        enforced_during_capture: true,
        allowed_origin: baseUrl.origin,
        foreign_origins: 'blocked-and-fail-capture',
        foreign_loopback: 'blocked-before-connect-and-fail-capture',
        service_workers: 'blocked',
        websockets: 'blocked-before-connect-and-fail-capture',
      },
    },
    capture_environment: {
      ...provenance,
      runner_os: process.env.RUNNER_OS ?? process.platform,
      runner_arch: process.env.RUNNER_ARCH ?? process.arch,
      node_version: process.version,
      browser: { name: 'chromium', version: browserVersion },
      command: 'node scripts/qa/capture-series-a-proof.mjs',
      loopback_base_url: baseUrl.href,
      external_font_policy:
        'Google Fonts CSS replaced with an empty response; system fallback used',
    },
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    captures: results,
    non_claims: [
      provenance.authority === 'LOCAL_NON_AUTHORITATIVE'
        ? 'This local capture binds screenshots to exact locally built source bytes but is non-authoritative for hosted evidence gates.'
        : 'Hosted metadata binds exact built bytes to the validated GitHub workflow runtime identity.',
      'They do not prove deployment, production runtime, customer use, or external service parity.',
    ],
    publication: {
      method: 'adjacent-copy-digest-verify-atomic-rename',
      destination_required_absent: true,
      overwrite_allowed: false,
    },
  };

  await writeFile(
    path.join(captureDirectory, 'capture-metadata.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8',
  );
  await publishCaptureDirectory(repositoryRoot, captureDirectory, outputDirectory);

  if (failed.length > 0) {
    process.stderr.write(`Series A screenshot proof failed for ${failed.length} viewport(s).\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Series A screenshot proof captured ${results.length} viewports for ${sourceSha}.\n`,
    );
  }
} finally {
  if (build?.temporaryRoot) {
    await rm(build.temporaryRoot, { force: true, recursive: true });
  }
}
