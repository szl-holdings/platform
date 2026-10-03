#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import { arch, platform, release, tmpdir } from 'node:os';
import path from 'node:path';
import { verifyProductInteractions } from './a11oy-product-interactions.mjs';

const repositoryRoot = path.resolve(process.cwd());
const repositoryRealRoot = await realpath(repositoryRoot);
const gitExecutable = process.env.GIT_EXECUTABLE?.trim() || 'git';
const sourceRevision = requiredSha('SOURCE_REVISION');
const sourceTreeSha = requiredSha('SOURCE_TREE_SHA');
const sourceRef = requiredText('SOURCE_REF', 300);
const sourceRepository = requiredRepository('SOURCE_REPOSITORY');
const captureEnvironment = requiredText('CAPTURE_ENVIRONMENT', 100);
const runIdentity = requiredText('RUN_IDENTITY', 1_024);
const capturedBy = requiredText('CAPTURED_BY', 200);
const planPath =
  process.env.SCREENSHOT_PLAN?.trim() || 'audit/series-a-screenshot-capture-plan.json';
const outputDirectory =
  process.env.SCREENSHOT_OUTPUT_DIR?.trim() || 'artifacts/a11oy-product-matrix-screenshot-proof';
const MIN_CANONICAL_CAPTURE_TIMEOUT_MS = 10 * 60 * 1_000;
const MAX_CANONICAL_CAPTURE_TIMEOUT_MS = 90 * 60 * 1_000;
const CANONICAL_CAPTURE_TIMEOUT_PER_CASE_MS = 75 * 1_000;
const SOURCE_IDENTITY_PATH = '/a11oy/__source-identity.json';

function terminateChildTree(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    killer.once('error', () => child.kill());
    return;
  }
  child.kill('SIGTERM');
}

async function runChild(command, args, options) {
  const { timeout, ...spawnOptions } = options;
  if (!Number.isSafeInteger(timeout) || timeout <= 0) {
    throw new Error('child timeout must be a positive safe integer');
  }

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...spawnOptions,
      stdio: 'inherit',
      windowsHide: true,
    });
    let timedOut = false;
    let settled = false;
    let forceTimer;

    const settle = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      if (forceTimer) clearTimeout(forceTimer);
      if (error) reject(error);
      else resolve();
    };

    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      terminateChildTree(child);
      forceTimer = setTimeout(() => {
        if (child.exitCode === null) child.kill('SIGKILL');
      }, 5_000);
      forceTimer.unref?.();
    }, timeout);
    timeoutTimer.unref?.();

    child.once('error', (error) => {
      settle(new Error(`failed to start child process ${command}`, { cause: error }));
    });
    child.once('close', (code, signal) => {
      if (timedOut) {
        settle(new Error(`child process timed out after ${timeout}ms`));
      } else if (code !== 0) {
        settle(
          new Error(
            `child process exited with code ${code ?? 'null'}${signal ? ` and signal ${signal}` : ''}`,
          ),
        );
      } else {
        settle();
      }
    });
  });
}

function requiredText(name, maxLength) {
  const value = process.env[name]?.trim();
  if (!value || value.length > maxLength) throw new Error(`${name} is required`);
  return value;
}

function requiredSha(name) {
  const value = requiredText(name, 40).toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(`${name} must be a full lowercase Git SHA`);
  return value;
}

function requiredRepository(name) {
  const value = requiredText(name, 200);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error(`${name} must be an owner/repository slug`);
  }
  return value;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function gitBuffer(args) {
  return execFileSync(gitExecutable, args, {
    cwd: repositoryRoot,
    timeout: 15_000,
    maxBuffer: 16 * 1024 * 1024,
  });
}

function git(args) {
  return gitBuffer(args).toString('utf8').trim();
}

function normalizeGitHubRepository(remoteUrl) {
  const match = String(remoteUrl)
    .trim()
    .match(
      /^(?:https:\/\/github\.com\/|ssh:\/\/git@github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?$/,
    );
  if (!match) throw new Error('origin must be a canonical GitHub repository URL');
  return match[1];
}

const originRepository = normalizeGitHubRepository(git(['remote', 'get-url', 'origin']));
if (originRepository.toLowerCase() !== sourceRepository.toLowerCase()) {
  throw new Error(
    `SOURCE_REPOSITORY ${sourceRepository} does not match origin repository ${originRepository}`,
  );
}

function listUntrackedFiles() {
  return gitBuffer(['ls-files', '--others', '--exclude-standard', '-z'])
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map((entry) => entry.replaceAll('\\', '/'));
}

function verifyCheckout(phase, allowedUntrackedDirectory = null) {
  const head = git(['rev-parse', 'HEAD']);
  const tree = git(['rev-parse', 'HEAD^{tree}']);
  const branch = git(['symbolic-ref', '--quiet', '--short', 'HEAD']);
  const trackedStatus = git(['status', '--porcelain=v1', '--untracked-files=no']);
  if (head !== sourceRevision) {
    throw new Error(`${phase} source ${head} does not match SOURCE_REVISION ${sourceRevision}`);
  }
  if (tree !== sourceTreeSha) {
    throw new Error(`${phase} tree ${tree} does not match SOURCE_TREE_SHA ${sourceTreeSha}`);
  }
  if (branch !== sourceRef) {
    throw new Error(`${phase} branch ${branch} does not match SOURCE_REF ${sourceRef}`);
  }
  if (trackedStatus) throw new Error(`tracked source changed ${phase}: ${trackedStatus}`);
  const allowedPrefix = allowedUntrackedDirectory
    ? `${allowedUntrackedDirectory.replaceAll('\\', '/').replace(/\/$/, '')}/`
    : null;
  const unexpectedUntracked = listUntrackedFiles().filter(
    (entry) => !allowedPrefix || !entry.startsWith(allowedPrefix),
  );
  if (unexpectedUntracked.length > 0) {
    throw new Error(
      `untracked source input exists ${phase}: ${unexpectedUntracked.slice(0, 20).join(', ')}`,
    );
  }
}

function resolveInsideRepository(relativePath, label) {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`${label} must be repository-relative`);
  }
  const resolved = path.resolve(repositoryRoot, relativePath);
  const relative = path.relative(repositoryRoot, resolved);
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} must stay inside the repository checkout`);
  }
  return resolved;
}

function assertRealPathInsideRepository(resolved, label) {
  const relative = path.relative(repositoryRealRoot, resolved);
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} real path must stay inside the repository checkout`);
  }
}

async function rejectSymlinkComponents(absolutePath, label) {
  const relative = path.relative(repositoryRoot, absolutePath);
  let current = repositoryRoot;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let details;
    try {
      details = await lstat(current);
    } catch (error) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }
    if (details.isSymbolicLink()) throw new Error(`${label} cannot traverse a symbolic link`);
  }
}

async function readTrackedFile(relativePath, label) {
  const absolute = resolveInsideRepository(relativePath, label);
  await rejectSymlinkComponents(absolute, label);
  const details = await lstat(absolute);
  if (!details.isFile() || details.isSymbolicLink()) {
    throw new Error(`${label} must be a regular tracked file`);
  }
  const resolved = await realpath(absolute);
  assertRealPathInsideRepository(resolved, label);
  const repositoryPath = path.relative(repositoryRoot, absolute).replaceAll(path.sep, '/');
  git(['ls-files', '--error-unmatch', '--', repositoryPath]);
  const workingBytes = await readFile(absolute);
  const committedBytes = gitBuffer(['show', `HEAD:${repositoryPath}`]);
  if (!workingBytes.equals(committedBytes)) {
    throw new Error(`${label} bytes do not match HEAD:${repositoryPath}`);
  }
  return {
    absolute,
    repositoryPath,
    bytes: workingBytes,
    sha256: sha256(workingBytes),
  };
}

async function prepareOutputDirectory(relativePath) {
  const absolute = resolveInsideRepository(relativePath, 'SCREENSHOT_OUTPUT_DIR');
  await rejectSymlinkComponents(absolute, 'SCREENSHOT_OUTPUT_DIR');
  try {
    const details = await lstat(absolute);
    if (!details.isDirectory() || details.isSymbolicLink()) {
      throw new Error('SCREENSHOT_OUTPUT_DIR must be a regular directory');
    }
    const existing = await readdir(absolute);
    if (existing.length > 0) throw new Error('SCREENSHOT_OUTPUT_DIR must be absent or empty');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    await mkdir(absolute, { recursive: true });
  }
  await rejectSymlinkComponents(absolute, 'SCREENSHOT_OUTPUT_DIR');
  const resolved = await realpath(absolute);
  assertRealPathInsideRepository(resolved, 'SCREENSHOT_OUTPUT_DIR');
  return absolute;
}

async function collectAssetManifest(root) {
  const entries = [];
  async function visit(directory) {
    const names = await readdir(directory);
    names.sort((left, right) => left.localeCompare(right));
    for (const name of names) {
      const absolute = path.join(directory, name);
      const details = await lstat(absolute);
      if (details.isSymbolicLink())
        throw new Error(`build output contains a symbolic link: ${absolute}`);
      if (details.isDirectory()) {
        await visit(absolute);
      } else if (details.isFile()) {
        const bytes = await readFile(absolute);
        entries.push({
          path: path.relative(root, absolute).replaceAll(path.sep, '/'),
          bytes: bytes.length,
          sha256: sha256(bytes),
        });
      } else {
        throw new Error(`build output contains a non-regular entry: ${absolute}`);
      }
    }
  }
  await visit(root);
  if (entries.length === 0 || !entries.some((entry) => entry.path === 'index.html')) {
    throw new Error('clean A11oy build did not produce index.html and asset bytes');
  }
  return entries;
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

async function startExactBuildServer(buildRoot, assetManifest, servedIdentity) {
  const resolvedBuildRoot = path.resolve(buildRoot);
  const assetByPath = new Map(assetManifest.map((entry) => [entry.path, entry]));
  const identityDocument = {
    schema: 'szl.a11oy-served-build-identity/v1',
    source_revision: servedIdentity.sourceRevision,
    source_tree_sha: servedIdentity.sourceTreeSha,
    build_manifest_sha256: servedIdentity.buildManifestSha256,
    index_html_sha256: servedIdentity.indexHtmlSha256,
    base_path: '/a11oy/',
    proof_nonce: servedIdentity.proofNonce,
  };
  const identityBytes = Buffer.from(`${JSON.stringify(identityDocument)}\n`, 'utf8');
  const identityHeaders = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-SZL-Build-Manifest-SHA256': servedIdentity.buildManifestSha256,
    'X-SZL-Proof-Nonce': servedIdentity.proofNonce,
    'X-SZL-Source-SHA': servedIdentity.sourceRevision,
    'X-SZL-Source-Tree-SHA': servedIdentity.sourceTreeSha,
  };
  let expectedHost = null;
  const server = createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method || '')) {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
      }
      if (!expectedHost || request.headers.host !== expectedHost) {
        response.writeHead(400);
        response.end();
        return;
      }
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      const decodedPath = decodeURIComponent(requestUrl.pathname);
      if (decodedPath === SOURCE_IDENTITY_PATH) {
        response.writeHead(200, {
          ...identityHeaders,
          'Content-Length': String(identityBytes.length),
          'Content-Type': 'application/json; charset=utf-8',
        });
        if (request.method === 'HEAD') response.end();
        else response.end(identityBytes);
        return;
      }
      if (
        !(decodedPath === '/a11oy' || decodedPath.startsWith('/a11oy/')) ||
        decodedPath.includes('\\')
      ) {
        response.writeHead(404);
        response.end();
        return;
      }
      let relativePath = decodedPath.replace(/^\/a11oy\/?/, '');
      if (!relativePath || !path.extname(relativePath)) relativePath = 'index.html';
      const candidate = path.resolve(resolvedBuildRoot, relativePath);
      const relation = path.relative(resolvedBuildRoot, candidate);
      if (relation === '..' || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation)) {
        response.writeHead(400);
        response.end();
        return;
      }
      let details;
      try {
        details = await lstat(candidate);
      } catch {
        response.writeHead(404);
        response.end();
        return;
      }
      if (!details.isFile() || details.isSymbolicLink()) {
        response.writeHead(404);
        response.end();
        return;
      }
      const bytes = await readFile(candidate);
      const manifestEntry = assetByPath.get(relativePath);
      if (
        !manifestEntry ||
        manifestEntry.bytes !== bytes.length ||
        manifestEntry.sha256 !== sha256(bytes)
      ) {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('served asset no longer matches the verified build manifest');
        return;
      }
      response.writeHead(200, {
        ...identityHeaders,
        'Content-Length': String(bytes.length),
        'Content-Type': contentTypes.get(path.extname(candidate)) || 'application/octet-stream',
        'X-SZL-Served-Asset-SHA256': manifestEntry.sha256,
      });
      if (request.method === 'HEAD') response.end();
      else response.end(bytes);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(`source-bound preview error: ${String(error)}`);
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string' || address.address !== '127.0.0.1') {
    server.close();
    throw new Error('failed to bind an ephemeral IPv4 loopback preview');
  }
  expectedHost = `127.0.0.1:${address.port}`;
  const origin = `http://${expectedHost}`;
  return { server, origin, identityUrl: `${origin}${SOURCE_IDENTITY_PATH}` };
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

verifyCheckout('before clean build');
const outputRepositoryPath = path
  .relative(repositoryRoot, resolveInsideRepository(outputDirectory, 'SCREENSHOT_OUTPUT_DIR'))
  .replaceAll(path.sep, '/');
const planIdentity = await readTrackedFile(planPath, 'SCREENSHOT_PLAN');
const wrapperIdentity = await readTrackedFile(
  'scripts/qa/capture-series-a-product-matrix-proof.mjs',
  'A11oy product-matrix capture wrapper',
);
const canonicalIdentity = await readTrackedFile(
  'scripts/qa/capture-screenshot-proof.mjs',
  'canonical capture tool',
);
const layoutIdentity = await readTrackedFile(
  'scripts/qa/screenshot-layout-helpers.mjs',
  'browser layout verifier',
);
const interactionsIdentity = await readTrackedFile(
  'scripts/qa/a11oy-product-interactions.mjs',
  'product interaction verifier',
);
const viteConfigIdentity = await readTrackedFile(
  'artifacts/a11oy/vite.config.ts',
  'A11oy Vite configuration',
);
const styleIdentity = await readTrackedFile(
  'artifacts/a11oy/src/index.css',
  'A11oy root stylesheet',
);
const lockfileIdentity = await readTrackedFile('pnpm-lock.yaml', 'pnpm lockfile');
const packageIdentity = await readTrackedFile('package.json', 'root package manifest');
const capturePlan = JSON.parse(planIdentity.bytes.toString('utf8'));
if (capturePlan.schema !== 'szl.screenshot-capture-plan/v1') {
  throw new Error('A11oy product-matrix capture plan has an unsupported schema');
}
if (!Array.isArray(capturePlan.targets) || capturePlan.targets.length === 0) {
  throw new Error('A11oy product-matrix capture plan must declare targets');
}
if (capturePlan.workcell_id !== 'P0-SERIES-A-PRODUCT-WIRING-20260811') {
  throw new Error('A11oy product-matrix capture plan must bind the canonical workcell id');
}
const expectedCaptures = new Map();
for (const target of capturePlan.targets) {
  const route = String(target.route || '').trim();
  const heading = String(target.expected_heading || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!route.startsWith('/') || !heading) {
    throw new Error(
      'every A11oy product-matrix capture target must declare a route and expected_heading',
    );
  }
  if (!Array.isArray(target.viewports) || target.viewports.length === 0) {
    throw new Error(`capture target ${route} must declare viewports`);
  }
  const minimumScreenshotRevealElements =
    target.minimum_screenshot_reveal_elements === undefined
      ? 0
      : Number(target.minimum_screenshot_reveal_elements);
  if (
    !Number.isSafeInteger(minimumScreenshotRevealElements) ||
    minimumScreenshotRevealElements < 0
  ) {
    throw new Error(
      `capture target ${route} must declare a non-negative minimum_screenshot_reveal_elements`,
    );
  }
  for (const viewport of target.viewports) {
    const key = `${route}:${Number(viewport.width)}x${Number(viewport.height)}`;
    if (expectedCaptures.has(key)) {
      throw new Error(`duplicate A11oy product-matrix capture target: ${key}`);
    }
    expectedCaptures.set(key, { heading, minimumScreenshotRevealElements });
  }
}
const canonicalCaptureTimeoutMs = Math.min(
  MAX_CANONICAL_CAPTURE_TIMEOUT_MS,
  Math.max(
    MIN_CANONICAL_CAPTURE_TIMEOUT_MS,
    expectedCaptures.size * CANONICAL_CAPTURE_TIMEOUT_PER_CASE_MS,
  ),
);

const viteCli = path.join(
  repositoryRoot,
  'artifacts',
  'a11oy',
  'node_modules',
  'vite',
  'bin',
  'vite.js',
);
const vitePackagePath = path.join(
  repositoryRoot,
  'artifacts',
  'a11oy',
  'node_modules',
  'vite',
  'package.json',
);
const playwrightPackagePath = path.join(
  repositoryRoot,
  'node_modules',
  '@playwright',
  'test',
  'package.json',
);
const vitePackageBytes = await readFile(vitePackagePath);
const playwrightPackageBytes = await readFile(playwrightPackagePath);
const vitePackage = JSON.parse(vitePackageBytes.toString('utf8'));
const playwrightPackage = JSON.parse(playwrightPackageBytes.toString('utf8'));
const rootPackage = JSON.parse(packageIdentity.bytes.toString('utf8'));
if (rootPackage.packageManager !== 'pnpm@10.26.1') {
  throw new Error(`unexpected package manager declaration: ${rootPackage.packageManager}`);
}
const canonicalCapture = canonicalIdentity.absolute;
if (captureEnvironment === 'github-actions') {
  throw new Error('use the protected exact-head workflow for authoritative GitHub Actions capture');
}
const authority = 'LOCAL_NON_AUTHORITATIVE';

const absoluteOutputDirectory = await prepareOutputDirectory(outputDirectory);
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'a11oy-product-matrix-exact-'));
const resolvedTemporaryRoot = path.resolve(temporaryRoot);
const resolvedSystemTemp = path.resolve(tmpdir());
const relativeTemp = path.relative(resolvedSystemTemp, resolvedTemporaryRoot);
if (
  !relativeTemp ||
  relativeTemp === '..' ||
  relativeTemp.startsWith(`..${path.sep}`) ||
  path.isAbsolute(relativeTemp) ||
  !path.basename(resolvedTemporaryRoot).startsWith('a11oy-product-matrix-exact-')
) {
  throw new Error('temporary build path failed ownership validation');
}
const buildRoot = path.join(temporaryRoot, 'dist');

let preview;
let proofCandidate = null;
let captureCount = 0;
let operationError = null;

try {
  execFileSync(
    process.execPath,
    [
      viteCli,
      'build',
      '--config',
      'artifacts/a11oy/vite.config.ts',
      '--configLoader',
      'runner',
      '--outDir',
      buildRoot,
    ],
    {
      cwd: repositoryRoot,
      env: { ...process.env, BASE_PATH: '/a11oy/', NODE_ENV: 'production' },
      stdio: 'inherit',
      timeout: 10 * 60 * 1000,
    },
  );
  verifyCheckout('after clean build', outputRepositoryPath);

  const servedAssets = await collectAssetManifest(buildRoot);
  const assetManifestBytes = Buffer.from(`${JSON.stringify(servedAssets)}\n`, 'utf8');
  const servedAssetManifestSha256 = sha256(assetManifestBytes);
  const indexHtml = servedAssets.find((entry) => entry.path === 'index.html');
  if (!indexHtml) throw new Error('verified build manifest has no index.html entry');
  const servedIdentity = {
    sourceRevision,
    sourceTreeSha,
    buildManifestSha256: servedAssetManifestSha256,
    indexHtmlSha256: indexHtml.sha256,
    proofNonce: randomBytes(32).toString('hex'),
  };
  preview = await startExactBuildServer(buildRoot, servedAssets, servedIdentity);

  const interactions = await verifyProductInteractions(preview.origin, {
    expectedServedIdentity: servedIdentity,
  });
  if (interactions.served_identity?.state !== 'VERIFIED') {
    throw new Error('product interactions did not verify the served source/build identity');
  }
  const interactionBytes = Buffer.from(`${JSON.stringify(interactions, null, 2)}\n`, 'utf8');
  await writeFile(path.join(absoluteOutputDirectory, 'interactions.json'), interactionBytes);

  await runChild(process.execPath, [canonicalCapture], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      SCREENSHOT_BASE_URL: preview.origin,
      SCREENSHOT_OUTPUT_DIR: outputDirectory,
      SCREENSHOT_PLAN: planPath,
      SOURCE_REVISION: sourceRevision,
    },
    stdio: 'inherit',
    timeout: canonicalCaptureTimeoutMs,
  });

  const postCaptureAssets = await collectAssetManifest(buildRoot);
  const postCaptureManifestSha256 = sha256(
    Buffer.from(`${JSON.stringify(postCaptureAssets)}\n`, 'utf8'),
  );
  if (postCaptureManifestSha256 !== servedAssetManifestSha256) {
    throw new Error('served build assets changed during screenshot capture');
  }

  const canonicalMetadataPath = path.join(absoluteOutputDirectory, 'metadata.json');
  const canonicalMetadataBytes = await readFile(canonicalMetadataPath);
  const canonicalMetadata = JSON.parse(canonicalMetadataBytes.toString('utf8'));
  if (canonicalMetadata.state !== 'VERIFIED' || canonicalMetadata.failures?.length !== 0) {
    throw new Error('canonical screenshot capture did not verify every planned surface');
  }
  if (
    canonicalMetadata.source_revision !== sourceRevision ||
    canonicalMetadata.capture_environment !== captureEnvironment ||
    canonicalMetadata.captured_by !== capturedBy ||
    canonicalMetadata.workflow_run_or_command !== runIdentity
  ) {
    throw new Error('canonical screenshot metadata does not match the declared capture identity');
  }
  if (
    JSON.stringify(canonicalMetadata.allowed_origins) !== JSON.stringify([preview.origin]) ||
    !canonicalMetadata.browser?.version
  ) {
    throw new Error(
      'canonical screenshot metadata lacks the exact local origin or browser identity',
    );
  }
  if (
    !Array.isArray(canonicalMetadata.evidence) ||
    canonicalMetadata.evidence.length !== expectedCaptures.size
  ) {
    throw new Error('canonical screenshot capture count does not match the committed plan');
  }
  const observedCaptures = new Set();
  for (const record of canonicalMetadata.evidence) {
    const key = `${record.route}:${Number(record.viewport?.width)}x${Number(record.viewport?.height)}`;
    const expected = expectedCaptures.get(key);
    if (!expected || record.expected_heading !== expected.heading) {
      throw new Error(`captured surface does not match the committed plan: ${key}`);
    }
    const scrollReveal = record.scroll_reveal;
    if (
      record.minimum_screenshot_reveal_elements !== expected.minimumScreenshotRevealElements ||
      !scrollReveal ||
      !Number.isSafeInteger(scrollReveal.marked_elements) ||
      !Number.isSafeInteger(scrollReveal.unrevealed_elements) ||
      !Number.isSafeInteger(scrollReveal.sweep_steps) ||
      !Number.isFinite(scrollReveal.maximum_scroll_top) ||
      !Number.isFinite(scrollReveal.reached_bottom_scroll_top) ||
      !Number.isFinite(scrollReveal.final_scroll_top) ||
      scrollReveal.marked_elements < expected.minimumScreenshotRevealElements ||
      scrollReveal.unrevealed_elements !== 0 ||
      scrollReveal.sweep_steps < 1 ||
      scrollReveal.sweep_steps > 256 ||
      Math.abs(scrollReveal.reached_bottom_scroll_top - scrollReveal.maximum_scroll_top) > 1 ||
      Math.abs(scrollReveal.final_scroll_top) > 1
    ) {
      throw new Error(`captured surface has invalid scroll-reveal evidence: ${key}`);
    }
    if (observedCaptures.has(key)) throw new Error(`duplicate captured surface: ${key}`);
    observedCaptures.add(key);
    if (path.basename(record.filename) !== record.filename) {
      throw new Error(`captured filename escaped the evidence directory: ${record.filename}`);
    }
    const imagePath = path.join(absoluteOutputDirectory, record.filename);
    const imageBytes = await readFile(imagePath);
    if (sha256(imageBytes) !== record.artifact_sha256) {
      throw new Error(`captured image digest mismatch: ${record.filename}`);
    }
  }
  verifyCheckout('after capture', outputRepositoryPath);
  captureCount = canonicalMetadata.evidence.length;
  proofCandidate = {
    schema: 'szl.a11oy-product-matrix.source-bound-screenshot-proof/v1',
    state: 'VERIFIED',
    authority,
    source: {
      repository: sourceRepository,
      ref: sourceRef,
      revision: sourceRevision,
      tree_sha: sourceTreeSha,
    },
    capture_identity: {
      workcell_id: capturePlan.workcell_id,
      environment: captureEnvironment,
      captured_by: capturedBy,
      run_identity: runIdentity,
    },
    inputs: {
      plan: { path: planIdentity.repositoryPath, sha256: planIdentity.sha256 },
      wrapper: { path: wrapperIdentity.repositoryPath, sha256: wrapperIdentity.sha256 },
      canonical_capture: {
        path: canonicalIdentity.repositoryPath,
        sha256: canonicalIdentity.sha256,
      },
      layout_verifier: { path: layoutIdentity.repositoryPath, sha256: layoutIdentity.sha256 },
      interaction_verifier: {
        path: interactionsIdentity.repositoryPath,
        sha256: interactionsIdentity.sha256,
      },
      vite_config: {
        path: viteConfigIdentity.repositoryPath,
        sha256: viteConfigIdentity.sha256,
      },
      root_stylesheet: { path: styleIdentity.repositoryPath, sha256: styleIdentity.sha256 },
      lockfile: { path: lockfileIdentity.repositoryPath, sha256: lockfileIdentity.sha256 },
      root_package: { path: packageIdentity.repositoryPath, sha256: packageIdentity.sha256 },
    },
    toolchain: {
      operating_system: { platform: platform(), release: release(), architecture: arch() },
      node: { version: process.version, executable: path.basename(process.execPath) },
      git: { version: git(['--version']), executable: path.basename(gitExecutable) },
      declared_package_manager: rootPackage.packageManager,
      dependency_install:
        'not performed by this local wrapper; dependency bytes are not authoritative promotion evidence',
      vite: {
        version: vitePackage.version,
        package_manifest_sha256: sha256(vitePackageBytes),
        cli_sha256: sha256(await readFile(viteCli)),
      },
      playwright: {
        version: playwrightPackage.version,
        package_manifest_sha256: sha256(playwrightPackageBytes),
        chromium_version: canonicalMetadata.browser.version,
      },
    },
    build: {
      command:
        'node artifacts/a11oy/node_modules/vite/bin/vite.js build --config artifacts/a11oy/vite.config.ts --configLoader runner --outDir <fresh-temp-dir>',
      temporary_output: true,
      served_asset_count: servedAssets.length,
      served_asset_bytes: servedAssets.reduce((total, entry) => total + entry.bytes, 0),
      served_asset_manifest_sha256: servedAssetManifestSha256,
      post_capture_manifest_sha256: postCaptureManifestSha256,
      assets: servedAssets,
    },
    server: {
      kind: 'in-process-loopback-static-server',
      ownership: 'capture-series-a-product-matrix-proof.mjs',
      base_path: '/a11oy/',
      identity_path: SOURCE_IDENTITY_PATH,
      source_revision: sourceRevision,
      source_tree_sha: sourceTreeSha,
      build_manifest_sha256: servedAssetManifestSha256,
      index_html_sha256: indexHtml.sha256,
      proof_nonce_sha256: sha256(Buffer.from(servedIdentity.proofNonce, 'utf8')),
      cache_policy: 'no-store',
      allowed_origins: [preview.origin],
    },
    canonical_capture: {
      tool: canonicalIdentity.repositoryPath,
      metadata_sha256: sha256(canonicalMetadataBytes),
      captures: captureCount,
      timeout_ms: canonicalCaptureTimeoutMs,
    },
    interactions: {
      filename: 'interactions.json',
      sha256: sha256(interactionBytes),
      checked_states: interactions.records.length,
      state: interactions.state,
      served_identity_state: interactions.served_identity.state,
    },
    non_claims: [
      'This binds presentation evidence to a clean build and an immutable served-asset manifest for the recorded source revision.',
      authority === 'LOCAL_NON_AUTHORITATIVE'
        ? 'This local receipt is non-authoritative for hosted or protected promotion gates.'
        : 'The authenticated hosted runtime identity matched the recorded source revision.',
      'It does not prove deployment, production runtime, customer use, or external service parity.',
    ],
  };
} catch (error) {
  operationError = error;
}

const cleanupErrors = [];
if (preview) {
  try {
    await closeServer(preview.server);
  } catch (error) {
    cleanupErrors.push(error);
  }
}
try {
  await rm(resolvedTemporaryRoot, { recursive: true, force: true });
} catch (error) {
  cleanupErrors.push(error);
}
try {
  verifyCheckout('after teardown', outputRepositoryPath);
} catch (error) {
  cleanupErrors.push(error);
}
const terminalErrors = [operationError, ...cleanupErrors].filter(Boolean);
if (terminalErrors.length === 1) throw terminalErrors[0];
if (terminalErrors.length > 1) {
  throw new AggregateError(
    terminalErrors,
    'A11oy product-matrix capture and cleanup did not complete safely',
  );
}
if (!proofCandidate) {
  throw new Error('A11oy product-matrix capture completed without a proof candidate');
}

await writeFile(
  path.join(absoluteOutputDirectory, 'source-bound-metadata.json'),
  `${JSON.stringify(proofCandidate, null, 2)}\n`,
  'utf8',
);
process.stdout.write(
  `Source-bound A11oy product-matrix capture verified ${captureCount} images for ${sourceRevision} (${authority}).\n`,
);
