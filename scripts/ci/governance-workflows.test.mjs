import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function readRepositoryFile(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), 'utf8').replaceAll('\r\n', '\n');
}

function topLevelBlock(workflow, key) {
  const marker = `${key}:\n`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, `missing top-level workflow key ${key}`);

  const afterStart = start + marker.length;
  const nextKey = /^\S[^\n]*:\s*$/m.exec(workflow.slice(afterStart));
  const end = nextKey === null ? workflow.length : afterStart + nextKey.index;
  return workflow.slice(start, end);
}

function yamlJobBlock(workflow, jobName) {
  const marker = `  ${jobName}:\n`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, `missing workflow job ${jobName}`);

  const afterStart = start + marker.length;
  const nextJob = /\n {2}[A-Za-z0-9_-]+:\n/.exec(workflow.slice(afterStart));
  const end = nextJob === null ? workflow.length : afterStart + nextJob.index;
  return workflow.slice(start, end);
}

function yamlStepBlock(job, stepName) {
  const marker = `      - name: ${stepName}\n`;
  const start = job.indexOf(marker);
  assert.notEqual(start, -1, `missing workflow step ${stepName}`);

  const afterStart = start + marker.length;
  const nextStep = job.indexOf('\n      - ', afterStart);
  const end = nextStep === -1 ? job.length : nextStep;
  return job.slice(start, end);
}

function runScript(step) {
  const marker = '        run: |\n';
  const start = step.indexOf(marker);
  assert.notEqual(start, -1, 'missing multiline run block');

  return step
    .slice(start + marker.length)
    .split('\n')
    .map((line) => (line.startsWith('          ') ? line.slice(10) : line))
    .join('\n');
}

function shellCaseArm(script, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const marker = new RegExp(`^\\s*${escapedLabel}\\)\\s*$`, 'm');
  const match = marker.exec(script);
  assert.notEqual(match, null, `missing shell case arm ${label}`);

  const afterStart = match.index + match[0].length;
  const remainder = script.slice(afterStart);
  const nextArm = /^\s*(?:[A-Za-z][A-Za-z0-9_|-]*|\*)\)\s*$/m.exec(remainder);
  const end = nextArm === null ? script.length : afterStart + nextArm.index;
  return script.slice(afterStart, end);
}

function matchCount(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

test('reproducibility workflow requires two successful forced same-SHA builds', () => {
  const workflow = readRepositoryFile('.github/workflows/repro-check.yml');
  const events = topLevelBlock(workflow, 'on');
  const job = yamlJobBlock(workflow, 'repro');

  assert.match(events, /^ {2}pull_request:\s*$/m);
  assert.doesNotMatch(events, /^ {4}paths(?:-ignore)?:/m);
  assert.doesNotMatch(job, /^\s+continue-on-error:/m);
  assert.doesNotMatch(job, /\|\|/);
  assert.doesNotMatch(job, /2>\s*\/dev\/null/);

  assert.equal(matchCount(job, /uses: actions\/checkout@[0-9a-f]{40}/g), 2);
  assert.equal(matchCount(job, /^ {10}ref: \$\{\{ github\.sha \}\}$/gm), 2);
  assert.match(job, /^ {10}path: repro-build-b$/m);
  assert.equal(matchCount(job, /^ {8}run: pnpm install --frozen-lockfile$/gm), 2);
  assert.equal(matchCount(job, /^ {8}run: pnpm exec turbo run build --force$/gm), 2);

  const identity = runScript(yamlStepBlock(job, 'Verify both checkouts use the candidate SHA'));
  assert.match(identity, /git rev-parse HEAD/);
  assert.match(identity, /git -C repro-build-b rev-parse HEAD/);
  assert.equal(matchCount(identity, /GITHUB_SHA/g), 2);
});

test('reproducibility workflow compares complete nonempty path and byte manifests', () => {
  const workflow = readRepositoryFile('.github/workflows/repro-check.yml');
  const job = yamlJobBlock(workflow, 'repro');
  const turbo = JSON.parse(readRepositoryFile('turbo.json'));

  assert.deepEqual([...turbo.tasks.build.outputs].sort(), ['.next/**', 'build/**', 'dist/**']);

  for (const build of ['A', 'B']) {
    const manifestStep = yamlStepBlock(job, `Record complete build ${build} output manifest`);
    const manifest = runScript(manifestStep);
    const suffix = build.toLowerCase();

    if (build === 'A') {
      assert.doesNotMatch(manifestStep, /^ {8}working-directory:/m);
    } else {
      assert.match(manifestStep, /^ {8}working-directory: repro-build-b$/m);
    }
    assert.match(manifest, /^set -euo pipefail$/m);
    assert.match(manifest, /^find \. \\$/m);
    assert.match(manifest, /-path '\*\/dist\/\*'/);
    assert.match(manifest, /-path '\*\/build\/\*'/);
    assert.match(manifest, /-path '\*\/\.next\/\*'/);
    assert.match(manifest, /-path '\*\/node_modules'/);
    assert.match(manifest, /-path '\*\/\.git'/);
    assert.match(manifest, /-path '\*\/\.turbo'/);
    assert.match(manifest, /-print0/);
    assert.match(manifest, /LC_ALL=C sort -z/);
    assert.match(manifest, /sha256sum "\$artifact"/);
    assert.match(manifest, new RegExp(`test -s /tmp/repro-build-${suffix}\\.sha256`));
    assert.doesNotMatch(manifest, /\|\|/);
    assert.doesNotMatch(manifest, /2>\s*\/dev\/null/);
  }

  const comparison = runScript(
    yamlStepBlock(job, 'Verify exact output-path and byte reproducibility'),
  );
  assert.match(comparison, /^set -euo pipefail$/m);
  assert.match(
    comparison,
    /diff --unified=3 \/tmp\/repro-build-a\.sha256 \/tmp\/repro-build-b\.sha256/,
  );
});

test('Storybook build contract excludes time and checkout-path variance', () => {
  const config = readRepositoryFile('packages/storybook/.storybook/main.ts');
  const lockfile = readRepositoryFile('pnpm-lock.yaml');
  const workspace = readRepositoryFile('pnpm-workspace.yaml');
  const patch = readRepositoryFile('patches/@storybook__core@8.6.18.patch');
  const patchHash = createHash('sha256').update(patch).digest('hex');

  // project.json contains a wall-clock generatedAt value and is not consumed by
  // the static Storybook runtime, so the deterministic build must omit it.
  assert.match(config, /core:\s*\{\s*disableProjectJson: true,\s*disableTelemetry: true,\s*\}/s);
  assert.match(
    workspace,
    /^ {2}'@storybook\/core@8\.6\.18': patches\/@storybook__core@8\.6\.18\.patch$/m,
  );
  assert.match(
    lockfile,
    new RegExp(
      `^ {2}'@storybook/core@8\\.6\\.18':\\n {4}hash: ${patchHash}\\n {4}path: patches/@storybook__core@8\\.6\\.18\\.patch$`,
      'm',
    ),
  );
  assert.match(
    lockfile,
    new RegExp(`^ {2}'@storybook/core@8\\.6\\.18\\(patch_hash=${patchHash}\\)\\(`, 'm'),
  );

  // Absolute cache-entry paths affect esbuild's identifier allocation. Keep
  // syntax and whitespace minification, but make identifiers path-independent.
  const changedLines = patch
    .split('\n')
    .filter((line) => /^[+-]/.test(line) && !/^(?:---|\+\+\+)/.test(line));
  assert.equal(
    matchCount(
      patch,
      /^diff --git a\/dist\/builder-manager\/index\.cjs b\/dist\/builder-manager\/index\.cjs$/gm,
    ),
    1,
  );
  assert.equal(
    matchCount(
      patch,
      /^diff --git a\/dist\/builder-manager\/index\.js b\/dist\/builder-manager\/index\.js$/gm,
    ),
    1,
  );
  const oneModuleFormat = [
    '-    minify: !0,',
    '+    minifySyntax: !0,',
    '+    minifyWhitespace: !0,',
    '+    minifyIdentifiers: !1,',
    '-    minify: !0',
    '+    minifySyntax: !0,',
    '+    minifyWhitespace: !0,',
    '+    minifyIdentifiers: !1',
  ];
  assert.deepEqual(changedLines, [...oneModuleFormat, ...oneModuleFormat]);
});

test('aggregate axe gate accepts success as its sole passing result', () => {
  const workflow = readRepositoryFile('.github/workflows/a11y.yml');
  const gate = yamlJobBlock(workflow, 'a11y-gate');
  const enforcement = yamlStepBlock(gate, 'Enforce a11y gate');
  const script = runScript(enforcement);

  assert.match(gate, /^ {4}needs: a11y-axe$/m);
  assert.match(gate, /^ {4}if: always\(\)$/m);
  assert.doesNotMatch(gate, /^\s+continue-on-error:/m);
  assert.match(script, /^result="\$\{\{ needs\.a11y-axe\.result \}\}"$/m);
  assert.doesNotMatch(shellCaseArm(script, 'success'), /exit 1/);
  assert.match(shellCaseArm(script, 'failure'), /exit 1/);
  assert.match(shellCaseArm(script, 'cancelled|skipped'), /exit 1/);
  assert.match(shellCaseArm(script, '*'), /exit 1/);
});

test('browser workflows build the selected app and its compiled workspace dependencies', () => {
  const workflows = [
    ['.github/workflows/a11y.yml', 'matrix.app.filter'],
    ['.github/workflows/e2e.yml', 'matrix.filter'],
    ['.github/workflows/lighthouse.yml', 'matrix.app.filter'],
  ];
  const turbo = JSON.parse(readRepositoryFile('turbo.json'));
  assert.ok(turbo.tasks.build.dependsOn.includes('^build'));
  for (const [workflowPath, filter] of workflows) {
    const workflow = readRepositoryFile(workflowPath);
    const command = `pnpm exec turbo run build --filter='\${{ ${filter} }}...' --env-mode=loose --force`;
    assert.equal(
      workflow.split(command).length - 1,
      1,
      `${workflowPath} must build dependencies before the app`,
    );
    assert.doesNotMatch(workflow, /pnpm --filter[^\n]+ run build/);
  }
});

test('browser workflows serve builds with the exact repository-pinned CLI', () => {
  const packageJson = JSON.parse(readRepositoryFile('package.json'));
  const lockfile = readRepositoryFile('pnpm-lock.yaml');
  const workflows = new Map([
    [
      '.github/workflows/a11y.yml',
      'pnpm exec serve ${{ matrix.app.dist }} -l ${{ matrix.app.port }} --single &',
    ],
    ['.github/workflows/e2e.yml', 'pnpm exec serve ${{ matrix.dist }} -s -l ${{ matrix.port }} &'],
    [
      '.github/workflows/lighthouse.yml',
      'pnpm exec serve ${{ matrix.app.dist }} -l ${{ matrix.app.port }} &',
    ],
  ]);

  assert.equal(packageJson.devDependencies.serve, '14.2.6');
  assert.match(lockfile, /^ {6}serve:\n {8}specifier: 14\.2\.6\n {8}version: 14\.2\.6$/m);

  for (const [workflowPath, expectedInvocation] of workflows) {
    const workflow = readRepositoryFile(workflowPath);

    assert.equal(
      workflow.split(expectedInvocation).length - 1,
      1,
      `${workflowPath} must invoke the local serve CLI exactly once`,
    );
    assert.equal(
      matchCount(workflow, /\bpnpm exec serve\b/g),
      1,
      `${workflowPath} must have exactly one repository-local serve launch`,
    );
    assert.doesNotMatch(
      workflow,
      /\b(?:npm|pnpm)\s+(?:i|install|add)\b[^\n]*\bserve(?:@|\b)|\byarn\s+(?:global\s+)?add\b[^\n]*\bserve(?:@|\b)|\b(?:npx|pnpx)\s+serve(?:@|\b)|\b(?:npm|pnpm|yarn)\s+(?:exec|dlx)\s+serve@/,
      `${workflowPath} must not download or globally install serve at runtime`,
    );
    assert.doesNotMatch(
      workflow,
      /(^|\n)\s*serve\s+/,
      `${workflowPath} must not depend on a mutable global serve binary`,
    );
  }
});

test('per-artifact accessibility scan proves the React application mounted', () => {
  const spec = readRepositoryFile('tests/e2e/a11y.spec.ts');

  assert.match(spec, /page\.locator\('#root'\)/);
  assert.match(spec, /React root must exist/);
  assert.match(spec, /root\.locator\(':scope > \*'\)\.count\(\)/);
  assert.match(spec, /React must mount non-empty content/);
});

test('required E2E matrix fails closed when a specification is missing', () => {
  const workflow = readRepositoryFile('.github/workflows/e2e.yml');
  const job = yamlJobBlock(workflow, 'e2e-app');
  const run = yamlStepBlock(job, 'Run E2E tests for ${{ matrix.app }}');

  assert.match(run, /spec_path="tests\/e2e\/\$\{\{ matrix\.spec \}\}"/);
  assert.match(run, /if \[\[ ! -s "\$spec_path" \]\]/);
  assert.match(run, /Required E2E specification is missing or empty/);
  assert.match(run, /pnpm exec playwright test "\$spec_path"/);
  assert.doesNotMatch(run, /hashFiles\(|Skip notice|skipping .* E2E/i);
  assert.doesNotMatch(run, /^\s*if:/m);
});

test('a11y workflow scans the emitted app shell with root-resolved JavaScript', () => {
  const workflow = readRepositoryFile('.github/workflows/a11y.yml');
  const job = yamlJobBlock(workflow, 'a11y-axe');
  const build = yamlStepBlock(job, 'Build ${{ matrix.app.name }}');
  const serve = runScript(
    yamlStepBlock(
      job,
      'Serve ${{ matrix.app.name }} (SPA fallback) on port ${{ matrix.app.port }}',
    ),
  );

  for (const artifact of ['a11oy', 'carlota-jo', 'counsel', 'sentra', 'terra', 'vessels']) {
    assert.equal(
      matchCount(job, new RegExp(`^ {12}dist: artifacts/${artifact}/dist/public$`, 'gm')),
      1,
      `${artifact} must serve Vite's exact output directory`,
    );
  }

  assert.equal(matchCount(job, /^ {12}dist: artifacts\/[a-z0-9-]+\/dist\/public$/gm), 6);
  assert.doesNotMatch(job, /^ {12}dist: artifacts\/[a-z0-9-]+\/dist$/m);
  assert.match(build, /^ {10}BASE_PATH: \/$/m);

  assert.match(serve, /^set -euo pipefail$/m);
  assert.match(serve, /index_file="\$\{\{ matrix\.app\.dist \}\}\/index\.html"/);
  assert.match(serve, /\[\[ ! -s "\$index_file" \]\]/);
  assert.match(serve, /grep -Fq '<div id="root"><\/div>' "\$index_file"/);
  assert.match(serve, /asset_path=.*script type="module".*\\\.js/s);
  assert.match(serve, /asset_source_file="\$\{\{ matrix\.app\.dist \}\}\$\{asset_path\}"/);
  assert.match(serve, /\[\[ ! -s "\$asset_source_file" \]\]/);
  assert.match(serve, /cmp --silent "\$index_file" "\$response_file"/);
  assert.match(serve, /--dump-header "\$asset_headers"/);
  assert.match(serve, /cmp --silent "\$asset_source_file" "\$asset_file"/);
  assert.match(serve, /content-type: \*\(application\|text\)\/\(javascript\|x-javascript\)/);
  assert.match(serve, /^ready=false$/m);
  assert.match(serve, /^\s*ready=true$/m);
  assert.match(serve, /\[\[ "\$ready" != true \]\]/);
  assert.doesNotMatch(serve, /curl -sf[^\n]*> \/dev\/null/);
});

test('browser images use the proven glibc Vite-to-nginx contract', () => {
  const vessels = readRepositoryFile('artifacts/vessels/Dockerfile');
  const provenBase = vessels.match(
    /^FROM (node:26-bookworm-slim@sha256:[a-f0-9]{64}) AS pnpm-base$/m,
  );
  assert.notEqual(provenBase, null, 'Vessels must retain its proven glibc builder base');

  for (const [artifact, workspacePackage, route] of [
    ['carlota-jo', '@workspace/carlota-jo', '/carlota-jo/'],
    ['terra', '@workspace/terra', '/terra/'],
    ['vessels', '@workspace/vessels', '/vessels/'],
  ]) {
    const dockerfile = readRepositoryFile(`artifacts/${artifact}/Dockerfile`);

    assert.match(
      dockerfile,
      new RegExp(`^FROM ${provenBase[1]} AS pnpm-base$`, 'm'),
      `${artifact} must use the same digest-pinned Debian/glibc builder as Vessels`,
    );
    assert.doesNotMatch(dockerfile, /^FROM node:26-alpine/m);
    assert.match(dockerfile, /^ARG PNPM_VERSION=10\.26\.1$/m);
    assert.match(dockerfile, /^\s+pnpm fetch$/m);
    assert.match(dockerfile, /pnpm install --frozen-lockfile --ignore-scripts --prod=false/);
    assert.match(
      dockerfile,
      new RegExp(`^RUN pnpm --filter "${workspacePackage}" run build$`, 'm'),
    );
    assert.match(
      dockerfile,
      new RegExp(
        `^COPY --from=builder /app/artifacts/${artifact}/dist/public /usr/share/nginx/html$`,
        'm',
      ),
    );
    assert.doesNotMatch(
      dockerfile,
      new RegExp(
        `^COPY --from=builder /app/artifacts/${artifact}/dist /usr/share/nginx/html$`,
        'm',
      ),
    );
    assert.match(dockerfile, new RegExp(`^    location ${route.replaceAll('/', '\\/')} \\{$`, 'm'));
    assert.match(
      dockerfile,
      /sed -i 's\|\^\[\[:space:\]\]\*pid\[\[:space:\]\]\[\^;\]\*;\|pid \/tmp\/nginx\.pid;\|'/,
    );
    assert.match(dockerfile, /grep -Fqx 'pid \/tmp\/nginx\.pid;' \/etc\/nginx\/nginx\.conf/);
    assert.doesNotMatch(dockerfile, /pid\\s\*\/run\/nginx\.pid/);
    assert.match(dockerfile, /^HEALTHCHECK --interval=30s/m);
    assert.match(dockerfile, /^USER nginx$/m);
  }
});

test('build workflow gates pull requests with the exact dependency graph and full build', () => {
  const workflow = readRepositoryFile('.github/workflows/build.yml');
  const events = topLevelBlock(workflow, 'on');
  const job = yamlJobBlock(workflow, 'build-all');
  const install = yamlStepBlock(job, 'Install exact locked dependencies');
  const build = yamlStepBlock(job, 'Build every workspace target');

  assert.match(events, /^ {2}pull_request:$/m);
  assert.match(events, /^ {4}branches: \[master, main\]$/m);
  assert.match(workflow, /^ {2}ONNXRUNTIME_NODE_INSTALL: skip$/m);
  assert.match(install, /^ {8}run: pnpm install --frozen-lockfile --prefer-offline$/m);
  assert.doesNotMatch(workflow, /--no-frozen-lockfile/);
  assert.match(build, /^ {8}run: pnpm run build$/m);
  assert.doesNotMatch(job, /pnpm --filter/);
});

test('dependency-free governance regression is enforced locally and in CI', () => {
  const packageJson = JSON.parse(readRepositoryFile('package.json'));
  const ci = readRepositoryFile('.github/workflows/ci.yml');
  const cleanClone = yamlJobBlock(ci, 'clean-clone');
  const dependencyFreeTests = yamlStepBlock(cleanClone, 'Test dependency-free clone guards');
  const regression = 'scripts/ci/governance-workflows.test.mjs';

  assert.match(packageJson.scripts['verify:clean-clone'], new RegExp(regression));
  assert.match(packageJson.scripts.test, new RegExp(regression));
  assert.match(dependencyFreeTests, new RegExp(regression));
});

test('legacy source-of-truth entry point delegates only to the canonical validator', () => {
  const wrapper = readRepositoryFile('audit/verify.sh');

  assert.match(wrapper, /^#!\/usr\/bin\/env bash$/m);
  assert.match(wrapper, /command -v node/);
  assert.match(wrapper, /command -v git/);
  assert.match(wrapper, /scripts\/audit\/validate-source-of-truth\.js/);
  assert.match(wrapper, /audit\/source-of-truth\.json/);
  assert.match(wrapper, /repository root is incomplete/);
  assert.match(wrapper, /node is required/);
  assert.match(wrapper, /^exec "\$\{NODE_BIN\}" "\$\{VALIDATOR\}"$/m);
  assert.doesNotMatch(wrapper, /\b(?:python3|find|grep|read_sot)\b/);
});

test('runtime audit boots the compiled backend with TypeScript execution disabled', () => {
  const packageJson = JSON.parse(readRepositoryFile('package.json'));
  const workflow = readRepositoryFile('.github/workflows/audit-full.yml');
  const audit = yamlJobBlock(workflow, 'audit');
  const serviceRuntime = yamlStepBlock(audit, 'Verify deployable service runtime closure');
  const build = yamlStepBlock(audit, 'Build artifacts (needed to serve the SPAs + runtime API)');
  const boot = yamlStepBlock(audit, 'Boot web apps + runtime API for the qa-site smoke');

  assert.equal(
    packageJson.scripts['test:service-runtime'],
    'node --test scripts/ci/service-runtime-packaging.test.mjs scripts/ci/substrate-compose-packaging.test.mjs',
  );
  assert.match(serviceRuntime, /^ {8}run: pnpm run test:service-runtime$/m);
  assert.doesNotMatch(serviceRuntime, /continue-on-error/);
  assert.match(build, /^ {8}run: pnpm -r --if-present run build$/m);
  assert.match(boot, /NODE_OPTIONS=--no-strip-types/);
  assert.match(boot, /pnpm --filter @workspace\/alloy-runtime-api run start/);
  assert.match(boot, /ALLOY_API_TENANT_ID: runtime-audit-\$\{\{ github\.run_id \}\}/);
  assert.doesNotMatch(boot, /\btsx\b|src\/server\.ts/);
});

test('embedding API production artifact cannot enable the development auth bypass', () => {
  const artifact = readRepositoryFile(
    'apps/alloy-embedding-api/.replit-artifact/artifact.edit.toml',
  );

  assert.match(
    artifact,
    /^run = "env NODE_ENV=development AEF_AUTH_BYPASS=true pnpm --filter @workspace\/alloy-embedding-api run dev"$/m,
  );
  assert.match(artifact, /^AEF_AUTH_BYPASS = "false"$/m);
  assert.match(artifact, /^NODE_ENV = "production"$/m);
  assert.equal(matchCount(artifact, /^AEF_AUTH_BYPASS = "true"$/gm), 0);
});

test('CircleCI builds once and exercises the current local backend applications', () => {
  const circle = readRepositoryFile('.circleci/config.yml');
  const buildJob = yamlJobBlock(circle, 'build');
  const integrationJob = yamlJobBlock(circle, 'integration-test');
  const backendPackages = [
    ['apps/alloy-runtime-api/package.json', '@workspace/alloy-runtime-api'],
    ['apps/alloy-embedding-api/package.json', '@workspace/alloy-embedding-api'],
    ['apps/alloy-ingestion-orchestrator/package.json', '@workspace/alloy-ingestion-orchestrator'],
  ];

  assert.equal(matchCount(buildJob, /\bpnpm[^\n]*\brun build\b/g), 1);
  assert.match(buildJob, /command: pnpm run build/);

  for (const [manifestPath, packageName] of backendPackages) {
    const manifest = JSON.parse(readRepositoryFile(manifestPath));
    assert.equal(manifest.name, packageName);
    for (const scriptName of ['build', 'start', 'test']) {
      assert.equal(typeof manifest.scripts[scriptName], 'string');
      assert.ok(manifest.scripts[scriptName].length > 0);
    }
    assert.ok(integrationJob.includes(`--filter=${packageName}`));
    assert.ok(integrationJob.includes(`--filter ${packageName} run start`));
  }

  assert.match(integrationJob, /AEF_STORE_BACKEND: in-memory/);
  assert.match(integrationJob, /ORCHESTRATOR_AUTH_BYPASS: "true"/);
  assert.equal(matchCount(integrationJob, /NODE_OPTIONS: --no-strip-types/g), 3);
  assert.match(integrationJob, /127\.0\.0\.1:\$\{port\}\/healthz/);
  assert.match(integrationJob, /127\.0\.0\.1:\$\{port\}\/readyz/);
  assert.doesNotMatch(integrationJob, /\btsx\b|src\/(?:index|server)\.ts/);
  assert.doesNotMatch(
    circle,
    /@workspace\/api-server|node24-with-postgres|wait-for-postgres|pnpm migrate|pnpm test:integration|INTEGRATION_TEST_TOKEN/,
  );
});

test('developer and CI bootstrap paths enforce the repository toolchain', () => {
  const packageJson = JSON.parse(readRepositoryFile('package.json'));
  const devcontainer = JSON.parse(readRepositoryFile('.devcontainer/devcontainer.json'));
  const circle = readRepositoryFile('.circleci/config.yml');
  const replit = readRepositoryFile('.replit');
  const postMerge = readRepositoryFile('scripts/post-merge.sh');
  const activatePnpm = readRepositoryFile('scripts/activate-pnpm.sh');
  const expectedPnpm = packageJson.packageManager;
  const expectedPnpmVersion = expectedPnpm.replace(/^pnpm@/, '');

  assert.equal(expectedPnpm, 'pnpm@10.26.1');
  assert.equal(
    devcontainer.image,
    'mcr.microsoft.com/devcontainers/typescript-node:5.2.1-24-bookworm',
  );
  assert.match(devcontainer.postCreateCommand, /source scripts\/activate-pnpm\.sh/);
  assert.match(
    devcontainer.postCreateCommand,
    new RegExp(`test "\\$\\(pnpm --version\\)" = "${expectedPnpmVersion}"`),
  );
  assert.match(devcontainer.postCreateCommand, /\bpnpm install --frozen-lockfile'$/);
  assert.equal(devcontainer.remoteEnv.PNPM_HOME, '/home/vscode/.local/share/pnpm');
  assert.match(devcontainer.remoteEnv.PATH, /^\/home\/vscode\/\.local\/share\/pnpm:/);
  assert.doesNotMatch(devcontainer.postCreateCommand, /\bnpm install\b|\|\||\btrue\b/);

  assert.match(activatePnpm, new RegExp(`^EXPECTED_PNPM_VERSION="${expectedPnpmVersion}"$`, 'm'));
  assert.match(activatePnpm, /^[ \t]*export PATH="\$PNPM_HOME:\$PATH"$/m);
  assert.match(activatePnpm, /runtime's read-only preseeded Corepack cache first/);
  assert.match(activatePnpm, /COREPACK_HOME="\$\{COREPACK_HOME:-\$PNPM_HOME\/\.corepack\}"/);
  assert.match(activatePnpm, /export COREPACK_HOME/);
  assert.match(activatePnpm, /corepack enable --install-directory "\$PNPM_HOME"/);
  assert.match(activatePnpm, /--package-lock=false/);
  assert.match(activatePnpm, /--ignore-scripts/);
  assert.match(activatePnpm, /"pnpm@\$\{EXPECTED_PNPM_VERSION\}"/);
  assert.match(activatePnpm, /resolved_pnpm_version.*EXPECTED_PNPM_VERSION/);

  assert.equal(matchCount(circle, /^ {6}- image: cimg\/node:24\.4$/gm), 1);
  assert.match(circle, /^ {12}set -euo pipefail$/m);
  assert.match(circle, /^ {12}source scripts\/activate-pnpm\.sh$/m);
  assert.match(
    circle,
    new RegExp(`^ {12}test "\\$\\(pnpm --version\\)" = "${expectedPnpmVersion}"$`, 'm'),
  );
  assert.match(circle, /BASH_ENV/);
  assert.match(circle, /^ {10}command: pnpm install --frozen-lockfile --prefer-offline$/m);
  assert.doesNotMatch(circle, /pnpm install --no-frozen-lockfile/);

  assert.match(
    replit,
    /^args = \["bash", "-c", "source scripts\/activate-pnpm\.sh && exec pnpm store prune"\]$/m,
  );

  for (const [artifact, workspacePackage] of [
    ['a11oy', '@workspace/a11oy'],
    ['counsel', '@workspace/counsel'],
    ['carlota-jo', '@workspace/carlota-jo'],
    ['sentra', '@workspace/sentra'],
    ['terra', '@workspace/terra'],
    ['vessels', '@workspace/vessels'],
  ]) {
    const artifactConfig = readRepositoryFile(
      `artifacts/${artifact}/.replit-artifact/artifact.toml`,
    );
    assert.match(
      artifactConfig,
      new RegExp(
        `build = \\[ "bash", "-c", "source scripts/activate-pnpm\\.sh && exec pnpm --filter ${workspacePackage.replace('/', '\\/')} run build" \\]`,
      ),
    );
    assert.doesNotMatch(artifactConfig, /build = \[ "pnpm"/);
  }

  assert.match(postMerge, /^#!\/usr\/bin\/env bash$/m);
  assert.match(postMerge, /^set -euo pipefail$/m);
  assert.match(postMerge, /NODE_MAJOR=.*process\.versions\.node/);
  assert.match(postMerge, /NODE_MAJOR < 24/);
  assert.match(postMerge, /source "\$\{POST_MERGE_SCRIPT_DIR\}\/activate-pnpm\.sh"/);
  assert.match(
    postMerge,
    new RegExp(`^test "\\$\\(pnpm --version\\)" = "${expectedPnpmVersion}"$`, 'm'),
  );
  assert.equal(matchCount(postMerge, /^pnpm install --frozen-lockfile$/gm), 1);
  assert.doesNotMatch(postMerge, /\bnpm install\b|pnpm install[^\n]*(?:\|\||\btrue\b)/);
});
