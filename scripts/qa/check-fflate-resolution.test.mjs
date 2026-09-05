import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const guardPath = path.join(repositoryRoot, 'scripts/qa/check-fflate-resolution.mjs');

function runGuard(cwd = repositoryRoot) {
  return spawnSync(process.execPath, [path.join(cwd, 'scripts/qa/check-fflate-resolution.mjs')], {
    cwd,
    encoding: 'utf8',
  });
}

function withFixture(
  { workspaceVersion = '0.8.3', packageVersion = '0.8.3', edgeVersion = '0.8.3' },
  callback,
) {
  const root = mkdtempSync(path.join(tmpdir(), 'fflate-resolution-'));
  try {
    mkdirSync(path.join(root, 'scripts/qa'), { recursive: true });
    cpSync(guardPath, path.join(root, 'scripts/qa/check-fflate-resolution.mjs'));
    writeFileSync(
      path.join(root, 'pnpm-workspace.yaml'),
      `overrides:\n  fflate: ${workspaceVersion}\n`,
    );
    writeFileSync(
      path.join(root, 'pnpm-lock.yaml'),
      [
        "lockfileVersion: '9.0'",
        'packages:',
        `  fflate@${packageVersion}: {}`,
        'snapshots:',
        '  fixture@1.0.0:',
        '    dependencies:',
        `      fflate: ${edgeVersion}`,
        '',
      ].join('\n'),
    );
    callback(root);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}

test('repository resolution converges on fflate 0.8.3', () => {
  const result = runGuard();

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PASS: \d+ dependency edge\(s\) converge on fflate@0\.8\.3/);
});

test('guard rejects a downgraded workspace override', () => {
  withFixture({ workspaceVersion: '0.8.2' }, (root) => {
    const result = runGuard(root);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /must pin the central fflate override to 0\.8\.3/);
  });
});

test('guard rejects a non-converged dependency edge', () => {
  withFixture({ edgeVersion: '0.8.2' }, (root) => {
    const result = runGuard(root);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /non-converged dependency edges remain: 0\.8\.2/);
  });
});

test('blocking security workflow executes the focused test and fflate guard', () => {
  const workflow = readFileSync(
    path.join(repositoryRoot, '.github/workflows/security.yml'),
    'utf8',
  ).replaceAll('\r\n', '\n');
  const dependencyScanStart = workflow.indexOf('  dependency-scan:\n');
  const secretScanStart = workflow.indexOf('\n  secret-scan:\n');
  assert.notEqual(dependencyScanStart, -1);
  assert.notEqual(secretScanStart, -1);
  const dependencyScan = workflow.slice(dependencyScanStart, secretScanStart);

  assert.match(dependencyScan, /node --test scripts\/qa\/check-fflate-resolution\.test\.mjs/);
  assert.match(dependencyScan, /pnpm run security:fflate/);
  assert.match(
    workflow,
    /needs: \[dependency-scan, secret-scan, lockfile-integrity, license-report\]/,
  );
  assert.match(workflow, /name: Security Gate \(blocking\)/);
});
