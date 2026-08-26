import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  assertCheckoutRevision,
  assertCleanTrackedTree,
  assertPageAdmissible,
  assertSafeRepositoryPath,
  catalogEntryMarkdown,
  DEFAULT_ROUTE,
  EXPECTED_PLAYWRIGHT_VERSION,
  EXPECTED_PNPM_VERSION,
  screenshotFilename,
  surfaceFromRoute,
  surfaceLabelFromRoute,
  VIEWPORTS,
  validateCaptureIsolation,
  validateRoute,
  verifyEvidencePacketOnDisk,
} from './capture-series-a-exact-head.mjs';

const repository = 'szl-holdings/platform';
const sourceSha = 'a'.repeat(40);
const environment = {
  SZL_CANDIDATE_SHA: sourceSha,
  SZL_SOURCE_PR: '653',
  SZL_ROUTE: DEFAULT_ROUTE,
  GITHUB_REPOSITORY: repository,
  GITHUB_RUN_ID: '123456',
  GITHUB_RUN_ATTEMPT: '2',
  GITHUB_SERVER_URL: 'https://github.com',
};
const workflowRunUrl = 'https://github.com/szl-holdings/platform/actions/runs/123456/attempts/2';
const workcellId = 'exact-head-screenshot-pr-653-run-123456-attempt-2';

function workflowStepRun(workflow, name) {
  const stepMarker = `      - name: ${name}\n`;
  const stepStart = workflow.indexOf(stepMarker);
  assert.notEqual(stepStart, -1, `missing workflow step ${name}`);
  const runMarker = '        run: |\n';
  const runStart = workflow.indexOf(runMarker, stepStart);
  assert.notEqual(runStart, -1, `missing run block for ${name}`);
  const bodyStart = runStart + runMarker.length;
  const nextStep = workflow.indexOf('\n      - name:', bodyStart);
  const bodyEnd = nextStep === -1 ? workflow.length : nextStep;
  return workflow
    .slice(bodyStart, bodyEnd)
    .split('\n')
    .map((line) => (line.startsWith('          ') ? line.slice(10) : line))
    .join('\n');
}

function checkedSpawn(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function fakePng(width, height) {
  const bytes = Buffer.alloc(128);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes, 0);
  bytes.write('IHDR', 12, 'ascii');
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function admittedMetrics(overrides = {}) {
  return {
    finalUrl: 'http://127.0.0.1:4110/a11oy/',
    readyState: 'complete',
    screenshotReady: true,
    mainContentCount: 1,
    h1Count: 1,
    notFound: false,
    bodyTextLength: 200,
    blockedPlaceholder: null,
    busy: 0,
    scrollWidth: 390,
    clientWidth: 390,
    transient: [],
    ...overrides,
  };
}

async function writeFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'szl-exact-head-test-'));
  const artifactRoot = path.join(root, 'exact-head-evidence-artifact');
  const evidencePath = 'audit/series-a-exact-head-capture.json';
  const catalogPath = 'audit/screenshot-catalog.md';
  const surface = surfaceFromRoute(DEFAULT_ROUTE);
  const startedAt = new Date(Date.now() - 1_000);
  const capturedAt = new Date();
  const captureDate = startedAt.toISOString().slice(0, 10);
  const results = [];

  for (const viewport of VIEWPORTS) {
    const screenshot = `docs/assets/screenshots/current/${screenshotFilename(
      surface,
      captureDate,
      viewport.name,
    )}`;
    const bytes = fakePng(viewport.width, viewport.height);
    await mkdir(path.dirname(path.join(root, screenshot)), { recursive: true });
    await mkdir(path.dirname(path.join(artifactRoot, screenshot)), { recursive: true });
    await writeFile(path.join(root, screenshot), bytes);
    await writeFile(path.join(artifactRoot, screenshot), bytes);
    results.push({
      name: viewport.name,
      width: viewport.width,
      height: viewport.height,
      device_scale_factor: 1,
      route: DEFAULT_ROUTE,
      final_url: 'http://127.0.0.1:4110/a11oy/',
      http_status: 200,
      title: 'A11oy',
      ready_state: 'complete',
      screenshot_ready: true,
      main_content_count: 1,
      h1_count: 1,
      body_text_length: 200,
      not_found: false,
      blocked_placeholder: null,
      visible_busy_regions: 0,
      transient_states: [],
      console_errors: [],
      page_errors: [],
      scroll_width: viewport.width,
      client_width: viewport.width,
      horizontal_overflow: false,
      capture_date: captureDate,
      captured_at: capturedAt.toISOString(),
      screenshot,
      filename: screenshot,
      surface: 'A11oy Home',
      captured_by: 'GitHub Actions',
      capture_environment: 'github-actions',
      source_revision: sourceSha,
      workflow_run_or_command: workflowRunUrl,
      viewport: `${viewport.width} x ${viewport.height}`,
      artifact_sha256: digest(bytes),
      workcell_id: workcellId,
      proof_level: '3 — Evidence Proof',
      status: 'current',
      notes:
        'Exact-head source-presentation capture after readiness checks; not deployment evidence.',
      png_width: viewport.width,
      png_height: viewport.height,
      bytes: bytes.length,
      sha256: digest(bytes),
    });
  }

  const catalog = `# Screenshot catalog\n\n| Filename | Route | Surface | Capture date | Captured by | Capture environment | Source revision | Workflow run or command | Viewport | Artifact SHA-256 | Workcell ID | Proof level | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${results.map((row) => catalogEntryMarkdown(row)).join('\n')}\n`;
  const packet = {
    schema: 'szl.exact-head-screenshot-evidence/v1',
    state: 'VERIFIED',
    repository,
    source_pr: '653',
    source_sha: sourceSha,
    checkout_sha: sourceSha,
    workflow_run_id: '123456',
    workflow_run_attempt: '2',
    workflow_run_url: workflowRunUrl,
    workcell_id: workcellId,
    runner_image: 'ubuntu24@test',
    runner_arch: 'X64',
    node_version: 'v24.0.0',
    pnpm_version: EXPECTED_PNPM_VERSION,
    playwright_version: EXPECTED_PLAYWRIGHT_VERSION,
    browser_version: 'test',
    start_command:
      'pnpm --filter @workspace/a11oy exec vite --config vite.config.ts --host 127.0.0.1 --port 4110 --strictPort',
    base_url: 'http://127.0.0.1:4110',
    route: DEFAULT_ROUTE,
    surface,
    capture_dates: [captureDate],
    started_at: startedAt.toISOString(),
    captured_at: capturedAt.toISOString(),
    catalog_path: catalogPath,
    catalog_sha256: digest(Buffer.from(catalog)),
    results,
  };
  await mkdir(path.dirname(path.join(root, evidencePath)), { recursive: true });
  await mkdir(path.dirname(path.join(artifactRoot, evidencePath)), { recursive: true });
  await writeFile(path.join(root, catalogPath), catalog);
  await writeFile(path.join(root, evidencePath), `${JSON.stringify(packet, null, 2)}\n`);
  await copyFile(path.join(root, catalogPath), path.join(artifactRoot, catalogPath));
  await copyFile(path.join(root, evidencePath), path.join(artifactRoot, evidencePath));
  return { root, artifactRoot, evidencePath, packet };
}

test('the default and generated filenames bind a real A11oy surface and ISO date', () => {
  assert.equal(DEFAULT_ROUTE, '/a11oy/');
  assert.equal(validateRoute(DEFAULT_ROUTE), DEFAULT_ROUTE);
  assert.equal(surfaceFromRoute(DEFAULT_ROUTE), 'a11oy-home');
  assert.equal(surfaceLabelFromRoute(DEFAULT_ROUTE), 'A11oy Home');
  assert.equal(
    screenshotFilename('a11oy-home', '2026-08-20', 'phone-390'),
    'a11oy-home-2026-08-20-phone-390.png',
  );
  for (const invalid of ['/a11oy/start?x=1', '/a11oy/../admin', '//a11oy/', '/other/']) {
    assert.throws(() => validateRoute(invalid));
  }
});

test('checkout identity is fail-closed', () => {
  assert.doesNotThrow(() => assertCheckoutRevision(sourceSha, sourceSha));
  assert.doesNotThrow(() => assertCleanTrackedTree(''));
  assert.throws(() => assertCheckoutRevision(sourceSha, 'b'.repeat(40)), /does not match/);
  assert.throws(
    () => assertCleanTrackedTree(' M artifacts/a11oy/src/App.tsx'),
    /tracked candidate files changed/,
  );
});

test('candidate source, runtime home, and evidence roots must be disjoint', () => {
  const isolated = validateCaptureIsolation({
    SZL_CANDIDATE_ROOT: '/runner/work/platform/candidate',
    SZL_EVIDENCE_ROOT: '/runner/temp/evidence',
    SZL_CANDIDATE_HOME: '/runner/temp/candidate-home',
    SZL_CANDIDATE_USER: 'szl-capture-candidate',
  });
  assert.equal(isolated.candidateRoot, '/runner/work/platform/candidate');
  assert.equal(isolated.evidenceRoot, '/runner/temp/evidence');
  assert.throws(
    () =>
      validateCaptureIsolation({
        SZL_CANDIDATE_ROOT: '/runner/work/platform/candidate',
        SZL_EVIDENCE_ROOT: '/runner/work/platform/candidate/evidence',
        SZL_CANDIDATE_HOME: '/runner/temp/candidate-home',
        SZL_CANDIDATE_USER: 'szl-capture-candidate',
      }),
    /candidate and evidence roots must be disjoint/,
  );
  assert.throws(
    () =>
      validateCaptureIsolation({
        SZL_CANDIDATE_ROOT: '/runner/work/platform/candidate',
        SZL_EVIDENCE_ROOT: '/runner/temp/evidence',
        SZL_CANDIDATE_HOME: '/runner/temp/candidate-home',
        SZL_CANDIDATE_USER: 'runner',
      }),
    /SZL_CANDIDATE_USER/,
  );
});

test('an HTTP-200 SPA not-found surface is rejected', () => {
  assert.throws(
    () =>
      assertPageAdmissible({
        viewportName: 'phone-390',
        targetUrl: 'http://127.0.0.1:4110/a11oy/start',
        responseStatus: 200,
        metrics: admittedMetrics({
          finalUrl: 'http://127.0.0.1:4110/a11oy/start',
          notFound: true,
        }),
        consoleErrors: [],
        pageErrors: [],
      }),
    /not-found surface/,
  );
});

test('route changes, unfinished UI, and browser errors are rejected', () => {
  const base = {
    viewportName: 'phone-390',
    targetUrl: 'http://127.0.0.1:4110/a11oy/',
    responseStatus: 200,
    consoleErrors: [],
    pageErrors: [],
  };
  assert.doesNotThrow(() => assertPageAdmissible({ ...base, metrics: admittedMetrics() }));
  assert.throws(() =>
    assertPageAdmissible({
      ...base,
      metrics: admittedMetrics({ finalUrl: 'http://127.0.0.1:4110/a11oy/actions' }),
    }),
  );
  assert.throws(() =>
    assertPageAdmissible({ ...base, metrics: admittedMetrics({ screenshotReady: false }) }),
  );
  assert.throws(() =>
    assertPageAdmissible({ ...base, metrics: admittedMetrics(), consoleErrors: ['boom'] }),
  );
  assert.throws(
    () =>
      assertPageAdmissible({
        ...base,
        metrics: admittedMetrics({ transient: ['CONNECTING', 'Connecting to fabric...'] }),
      }),
    /nonterminal public state/,
  );
});

test('a complete isolated packet verifies', async (t) => {
  const fixture = await writeFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const packet = await verifyEvidencePacketOnDisk({ root: fixture.root, environment });
  assert.equal(packet.results.length, VIEWPORTS.length);
});

test('duplicate screenshot identities fail packet verification', async (t) => {
  const fixture = await writeFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  fixture.packet.results[1].screenshot = fixture.packet.results[0].screenshot;
  const packetBytes = `${JSON.stringify(fixture.packet, null, 2)}\n`;
  await writeFile(path.join(fixture.root, fixture.evidencePath), packetBytes);
  await writeFile(path.join(fixture.artifactRoot, fixture.evidencePath), packetBytes);
  await assert.rejects(
    verifyEvidencePacketOnDisk({ root: fixture.root, environment }),
    /duplicate result identity/,
  );
});

test('incomplete screenshot catalog metadata fails packet verification', async (t) => {
  const fixture = await writeFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  fixture.packet.results[0].workcell_id = '';
  const packetBytes = `${JSON.stringify(fixture.packet, null, 2)}\n`;
  await writeFile(path.join(fixture.root, fixture.evidencePath), packetBytes);
  await writeFile(path.join(fixture.artifactRoot, fixture.evidencePath), packetBytes);
  await assert.rejects(
    verifyEvidencePacketOnDisk({ root: fixture.root, environment }),
    /screenshot catalog metadata mismatch/,
  );
});

test('unbound files fail isolated-artifact verification', async (t) => {
  const fixture = await writeFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  await writeFile(path.join(fixture.artifactRoot, 'unbound.png'), 'not evidence');
  await assert.rejects(
    verifyEvidencePacketOnDisk({ root: fixture.root, environment }),
    /artifact file set is not isolated/,
  );
});

test('evidence output paths reject symlink escapes', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'szl-exact-head-link-test-'));
  const outside = await mkdtemp(path.join(os.tmpdir(), 'szl-exact-head-outside-'));
  t.after(() =>
    Promise.all([
      rm(root, { recursive: true, force: true }),
      rm(outside, { recursive: true, force: true }),
    ]),
  );
  await symlink(outside, path.join(root, 'audit'));
  await assert.rejects(
    assertSafeRepositoryPath(root, path.join(root, 'audit', 'packet.json')),
    /symbolic link/,
  );
});

test('truth refresh heredoc renders Markdown literally without command substitution', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'szl-truth-heredoc-test-'));
  const capturedBody = path.join(root, 'body.txt');
  t.after(() => rm(root, { recursive: true, force: true }));
  const workflow = await readFile(
    new URL('../../.github/workflows/truth-drift.yml', import.meta.url),
    'utf8',
  );
  const run = workflowStepRun(workflow, 'Open or update the protected refresh work item');
  const ghStub = `gh() {
    if [[ "$1 $2" == "issue list" ]]; then
      return 0
    fi
    local previous=''
    for argument in "$@"; do
      if [[ "$previous" == '--body' ]]; then
        printf '%s' "$argument" > "$CAPTURED_BODY"
        return 0
      fi
      previous="$argument"
    done
    printf 'unexpected gh invocation\\n' >&2
    return 1
  }`;
  const sourceSha = 'a'.repeat(40);
  const packageSha = 'b'.repeat(64);
  const result = spawnSync('/bin/bash', ['-c', `${ghStub}\n${run}`], {
    encoding: 'utf8',
    env: {
      ...process.env,
      CAPTURED_BODY: capturedBody,
      GITHUB_RUN_ID: '42',
      GITHUB_REPOSITORY: repository,
      GITHUB_SERVER_URL: 'https://github.com',
      PACKAGE_SHA256: packageSha,
      SOURCE_SHA: sourceSha,
    },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  const body = await readFile(capturedBody, 'utf8');
  assert.ok(body.includes(`source revision: \`${sourceSha}\``));
  assert.match(body, /generated path: `artifacts\/SOURCE_OF_TRUTH\.json`/);
  assert.ok(body.includes(`package SHA-256: \`${packageSha}\``));
  assert.match(body, /with `GITHUB_TOKEN`/);
});

test('unsafe tracked Git entries fail before candidate tooling can run', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'szl-unsafe-git-entry-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'package.json'), '{}\n');
  await symlink('/tmp/untrusted-target', path.join(root, 'tracked-link'));
  checkedSpawn('git', ['init', '--quiet'], { cwd: root });
  checkedSpawn('git', ['add', 'package.json', 'tracked-link'], { cwd: root });
  checkedSpawn(
    'git',
    [
      '-c',
      'user.name=Evidence Test',
      '-c',
      'user.email=evidence@example.invalid',
      'commit',
      '--quiet',
      '-m',
      'test fixture',
    ],
    { cwd: root },
  );
  const candidateSha = checkedSpawn('git', ['rev-parse', 'HEAD'], { cwd: root }).stdout.trim();
  const workflow = await readFile(
    new URL('../../.github/workflows/exact-head-screenshot-evidence.yml', import.meta.url),
    'utf8',
  );
  const run = workflowStepRun(
    workflow,
    'Reject unsafe candidate Git entries before dependency resolution',
  );
  const result = spawnSync('/bin/bash', ['-c', run], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CANDIDATE_SHA: candidateSha },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /tracked symbolic link or submodule/);
  assert.match(result.stderr, /tracked-link/);
});

test('candidate config cannot precede or redirect the protected install boundary', async () => {
  const workflow = await readFile(
    new URL('../../.github/workflows/exact-head-screenshot-evidence.yml', import.meta.url),
    'utf8',
  );
  const controller = workflow.indexOf('- name: Install and lock protected controller tooling');
  const prepare = workflow.indexOf('- name: Prepare isolated candidate dependency roots');
  const install = workflow.indexOf(
    '- name: Install nonexecuting candidate dependencies as isolated identity',
  );
  const lockdown = workflow.indexOf('- name: Verify install boundaries and lock candidate source');
  assert.ok(controller < prepare && prepare < install && install < lockdown);

  const controllerRun = workflowStepRun(workflow, 'Install and lock protected controller tooling');
  assert.match(controllerRun, /CONTROLLER_SHA/);
  assert.match(controllerRun, /controller_status/);
  assert.match(controllerRun, /chmod -R a-w "\$SZL_CONTROLLER_ROOT"/);

  const prepareRun = workflowStepRun(workflow, 'Prepare isolated candidate dependency roots');
  assert.match(prepareRun, /test -w "\$\(dirname "\$protected_root"\)"/);
  assert.match(prepareRun, /candidate dependency identity can rename protected root/);

  const installRun = workflowStepRun(
    workflow,
    'Install nonexecuting candidate dependencies as isolated identity',
  );
  assert.match(installRun, /\/usr\/bin\/env -i/);
  assert.match(installRun, /--config\.workspace-dir=\$SZL_CANDIDATE_ROOT/);
  assert.match(installRun, /--config\.lockfile-dir=\$SZL_CANDIDATE_ROOT/);
  assert.match(installRun, /--config\.store-dir=\$SZL_CANDIDATE_STORE/);
  assert.match(installRun, /--config\.cache-dir=\$SZL_CANDIDATE_CACHE/);
  assert.match(installRun, /--config\.modules-dir=node_modules/);
  assert.match(installRun, /--config\.virtual-store-dir=\$SZL_CANDIDATE_VIRTUAL_STORE/);
  assert.match(installRun, /--config\.userconfig=\$SZL_CANDIDATE_HOME\/config\/npmrc/);
  assert.match(installRun, /--config\.globalconfig=\$SZL_CANDIDATE_HOME\/config\/global-npmrc/);
  assert.match(installRun, /--ignore-scripts/);
  assert.match(installRun, /--ignore-pnpmfile/);

  const boundaryRun = workflowStepRun(
    workflow,
    'Verify install boundaries and lock candidate source',
  );
  assert.match(boundaryRun, /CONTROLLER_SHA/);
  assert.match(boundaryRun, /CANDIDATE_SHA/);
  assert.match(boundaryRun, /candidate dependency link escaped admitted roots/);
  assert.match(boundaryRun, /sudo chmod -R a-w "\$SZL_CANDIDATE_ROOT"/);
  assert.match(boundaryRun, /node_modules\/\.vite-temp/);
});

test('workflow binds PR, branch, permissions, publication, and artifact contracts', async () => {
  const workflow = await readFile(
    new URL('../../.github/workflows/exact-head-screenshot-evidence.yml', import.meta.url),
    'utf8',
  );
  const captureJob = workflow.slice(workflow.indexOf('  capture:'), workflow.indexOf('  publish:'));
  const publishJob = workflow.slice(workflow.indexOf('  publish:'));
  assert.match(workflow, /default: \/a11oy\//);
  assert.doesNotMatch(workflow, /default: ["']?608/);
  assert.match(workflow, /pulls\/\$\{SOURCE_PR\}/);
  assert.match(workflow, /test "\$pr_head" = "\$CANDIDATE_SHA"/);
  assert.match(workflow, /test "\$branch_head" = "\$CANDIDATE_SHA"/);
  const captureSource = await readFile(
    new URL('./capture-series-a-exact-head.mjs', import.meta.url),
    'utf8',
  );
  assert.match(captureSource, /--untracked-files=no/);
  assert.match(captureSource, /bodyText\s*\.split\(\/\\n\+\//);
  assert.equal(captureSource.match(/verifyCurrentCheckout\(inputs\.candidateSha,/g)?.length, 3);
  const preCaptureGuard = captureSource.indexOf(
    'const preCaptureSha = verifyCurrentCheckout(inputs.candidateSha, candidateRoot)',
  );
  const postTeardownGuard = captureSource.indexOf(
    'const postTeardownSha = verifyCurrentCheckout(inputs.candidateSha, candidateRoot)',
  );
  assert.ok(preCaptureGuard > captureSource.indexOf('if (!ready)'));
  assert.ok(preCaptureGuard < captureSource.indexOf('chromium.launch'));
  assert.ok(postTeardownGuard > captureSource.indexOf('await terminateServer(child)'));
  assert.match(workflow, /Verify candidate immediately before capture/);
  assert.match(captureJob, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /CONTROLLER_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /SZL_CANDIDATE_USER: szl-capture-candidate/);
  assert.match(workflow, /chmod -R a-w "\$SZL_CANDIDATE_ROOT"/);
  assert.match(workflow, /\$SZL_CANDIDATE_ROOT\/artifacts\/a11oy\/node_modules\/\.vite-temp/);
  assert.match(workflow, /\$SZL_CANDIDATE_ROOT\/artifacts\/a11oy\/node_modules\/\.cache/);
  assert.match(workflow, /install -d -m 0700 "\$SZL_EVIDENCE_ROOT"/);
  assert.match(workflow, /sudo --non-interactive --user/);
  assert.match(workflow, /\/usr\/bin\/env -i/);
  assert.match(workflow, /--ignore-scripts --ignore-pnpmfile/);
  for (const forcedConfig of [
    'workspace-dir',
    'lockfile-dir',
    'store-dir',
    'cache-dir',
    'modules-dir',
    'virtual-store-dir',
    'userconfig',
    'globalconfig',
    'state-dir',
    'global-dir',
    'global-bin-dir',
    'node-linker',
  ]) {
    assert.match(workflow, new RegExp(`--config\\.${forcedConfig}=`));
  }
  assert.match(
    workflow,
    /tracked_status="\$\(git -C "\$SZL_CANDIDATE_ROOT" status --porcelain=v1 --untracked-files=no\)"/,
  );
  assert.match(workflow, /test -z "\$tracked_status"/);
  assert.match(workflow, /inputs\.source_pr \|\| github\.event\.pull_request\.number/);
  assert.doesNotMatch(captureJob, /issues: write/);
  assert.match(publishJob, /issues: write/);
  assert.match(publishJob, /multiple open promotion work items/);
  assert.match(publishJob, /matches_text="\$\(gh api --paginate --slurp/);
  assert.match(publishJob, /gh issue edit/);
  assert.doesNotMatch(workflow, /if: always\(\)/);
  assert.match(workflow, /runner\.temp.*exact-head-evidence/);
  assert.doesNotMatch(workflow, /cp \.\.\/controller\/scripts\/ci\/capture-series-a-exact-head/);
  assert.match(workflow, /id: evidence_upload/);
  assert.match(workflow, /steps\.evidence_upload\.outputs\['artifact-id'\]/);
  assert.match(publishJob, /needs\.capture\.outputs\.artifact_digest/);
  assert.match(publishJob, /workflow run attempt/);
  assert.match(publishJob, /exact 90-day artifact/);
  assert.match(publishJob, /uploaded archive SHA-256/);
  const checkoutIndex = captureJob.indexOf('- name: Checkout exact candidate');
  const unsafeIndex = captureJob.indexOf(
    '- name: Reject unsafe candidate Git entries before dependency resolution',
  );
  const setupIndex = captureJob.indexOf('- name: Setup pnpm');
  const controllerIndex = captureJob.indexOf(
    '- name: Install and lock protected controller tooling',
  );
  const prepareIndex = captureJob.indexOf('- name: Prepare isolated candidate dependency roots');
  const installIndex = captureJob.indexOf(
    '- name: Install nonexecuting candidate dependencies as isolated identity',
  );
  const lockIndex = captureJob.indexOf(
    '- name: Verify install boundaries and lock candidate source',
  );
  const captureIndex = captureJob.indexOf('- name: Capture exact-head evidence');
  assert.ok(
    checkoutIndex < unsafeIndex &&
      unsafeIndex < setupIndex &&
      setupIndex < controllerIndex &&
      controllerIndex < prepareIndex &&
      prepareIndex < installIndex &&
      installIndex < lockIndex &&
      lockIndex < captureIndex,
    'candidate admission, controller trust, isolation, install, and lockdown order changed',
  );
  const unsafeRun = workflowStepRun(
    workflow,
    'Reject unsafe candidate Git entries before dependency resolution',
  );
  assert.match(unsafeRun, /120000/);
  assert.match(unsafeRun, /160000/);
  const controllerRun = workflowStepRun(workflow, 'Install and lock protected controller tooling');
  assert.match(controllerRun, /rev-parse HEAD.*CONTROLLER_SHA/);
  assert.match(controllerRun, /status --porcelain=v1 --untracked-files=no/);
  assert.match(controllerRun, /chmod -R a-w "\$SZL_CONTROLLER_ROOT"/);
  const boundaryRun = workflowStepRun(
    workflow,
    'Verify install boundaries and lock candidate source',
  );
  assert.match(boundaryRun, /CONTROLLER_SHA/);
  assert.match(boundaryRun, /SZL_DEPENDENCY_DIRS_MANIFEST/);
  assert.match(boundaryRun, /candidate dependency link escaped admitted roots/);
  assert.doesNotMatch(captureJob, /pnpm --dir candidate install/);
  const staging = await readFile(
    new URL('../../.github/workflows/deploy-staging.yml', import.meta.url),
    'utf8',
  );
  assert.match(staging, /branches: \[main, master\]/);
});
