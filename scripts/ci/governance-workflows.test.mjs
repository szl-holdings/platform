import assert from 'node:assert/strict';
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
