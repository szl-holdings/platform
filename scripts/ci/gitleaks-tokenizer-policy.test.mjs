import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('only the exact public tokenizer revision assignment is exempted from generic-api-key', () => {
  const config = readFileSync(new URL('../../.gitleaks.toml', import.meta.url), 'utf8');
  assert.equal(
    config.match(/^\[\[rules\]\]\n\s*id = "generic-api-key"$/gm)?.length,
    1,
    'Duplicate rule IDs overwrite earlier extensions in Gitleaks 8.21.2',
  );
  const rule = config.match(
    /\[\[rules\]\]\n  id = "generic-api-key"\n([\s\S]*?)(?=\n# ── Global allowlist)/,
  )?.[1];
  assert.ok(rule);
  assert.match(rule, /condition = "AND"/);
  assert.match(rule, /regexTarget = "line"/);
  assert.doesNotMatch(rule, /(?:^|\n)\s*(?:regex|entropy|secretGroup|keywords)\s*=/);
  const pathPattern = rule.match(/paths = \['''(.*?)'''\]/)?.[1];
  const linePattern = rule.match(/regexes = \['''(.*?)'''\]/)?.[1];
  assert.ok(pathPattern);
  assert.ok(linePattern);
  assert.doesNotMatch(
    linePattern,
    /\(\?:/,
    'Gitleaks uses Go RE2, which rejects non-capturing groups',
  );
  const permittedPath = new RegExp(pathPattern);
  const permittedLine = new RegExp(linePattern);
  const source = readFileSync(
    new URL('../../workers/alloy-vector-worker/src/tokenizer.ts', import.meta.url),
    'utf8',
  );
  const line = source
    .split('\n')
    .find((entry) => entry.startsWith('const DEFAULT_TOKENIZER_REVISION ='));
  assert.equal(permittedPath.test('workers/alloy-vector-worker/src/tokenizer.ts'), true);
  assert.equal(permittedLine.test(line), true);
  assert.equal(permittedLine.test(`\n${line}`), true);
  assert.equal(permittedLine.test(`\r\n${line}`), true);
  assert.equal(permittedPath.test('workers/alloy-vector-worker/src/backends.ts'), false);
  assert.equal(permittedPath.test('other/workers/alloy-vector-worker/src/tokenizer.ts'), false);
  assert.equal(permittedLine.test(line.replace('751bff', '851bff')), false);
  assert.equal(permittedLine.test(line.replace('DEFAULT_TOKENIZER_REVISION', 'API_KEY')), false);
  assert.equal(permittedLine.test(`${line} const API_KEY = 'another-value';`), false);
});

test('pinned Gitleaks admits exact public revision and rejects identical value outside exact path', (context) => {
  const version = spawnSync('gitleaks', ['version'], { encoding: 'utf8' });
  if (version.error?.code === 'ENOENT') {
    if (process.env.GITHUB_ACTIONS === 'true')
      assert.fail('Gitleaks must be installed before policy tests');
    context.skip('Pinned Gitleaks unavailable locally; required in hosted workflow');
    return;
  }
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), '8.21.2');
  const config = new URL('../../.gitleaks.toml', import.meta.url).pathname;
  const source = readFileSync(
    new URL('../../workers/alloy-vector-worker/src/tokenizer.ts', import.meta.url),
    'utf8',
  );
  const assignment = source
    .split('\n')
    .find((entry) => entry.startsWith('const DEFAULT_TOKENIZER_REVISION ='));
  const fixture = mkdtempSync(join(tmpdir(), 'gitleaks-tokenizer-policy-'));
  try {
    const directory = join(fixture, 'workers/alloy-vector-worker/src');
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'tokenizer.ts'), `// public model revision\n${assignment}\n`);
    const scan = () =>
      spawnSync(
        'gitleaks',
        ['detect', '--no-git', '--source', '.', '--config', config, '--redact', '--exit-code', '1'],
        { cwd: fixture, encoding: 'utf8' },
      );
    assert.equal(scan().status, 0, 'Exact tokenizer revision must be admitted');
    writeFileSync(
      join(directory, 'other.ts'),
      `// same bytes must still be detected outside the exact path\n${assignment}\n`,
    );
    assert.equal(scan().status, 1, 'Same value outside approved path must remain detectable');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('readiness digest has only one exact historical finding admission', () => {
  const path = 'platform/agents/readiness/readiness-security/executor.py';
  const fingerprint = `4d37b956685f6e52fa1ff13ee858416e095ad9e1:${path}:generic-api-key:36`;
  const entries = readFileSync(new URL('../../.gitleaksignore', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes(path));
  assert.deepEqual(entries, [fingerprint]);
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  assert.doesNotMatch(source, /PLATFORM_SECRET_STEP_SHA256/);
  assert.match(source, /^PLATFORM_SCANNER_STEP_SHA256 = "[0-9a-f]{64}"$/m);
  assert.match(source, /hashlib\.sha256\(step\.encode\("utf-8"\)\)\.hexdigest\(\) != PLATFORM_SCANNER_STEP_SHA256/);
});

test('pinned Gitleaks historical admission cannot suppress a future digest assignment', (context) => {
  const version = spawnSync('gitleaks', ['version'], { encoding: 'utf8' });
  if (version.error?.code === 'ENOENT') {
    if (process.env.GITHUB_ACTIONS === 'true')
      assert.fail('Gitleaks must be installed before policy tests');
    context.skip('Pinned Gitleaks unavailable locally; required in hosted workflow');
    return;
  }
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), '8.21.2');
  const path = 'platform/agents/readiness/readiness-security/executor.py';
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  const renamed = source.split('\n').find((line) => line.startsWith('PLATFORM_SCANNER_STEP_SHA256 ='));
  assert.ok(renamed);
  const historical = renamed.replace('PLATFORM_SCANNER_STEP_SHA256', 'PLATFORM_SECRET_STEP_SHA256');
  const config = new URL('../../.gitleaks.toml', import.meta.url).pathname;
  const ignored = readFileSync(new URL('../../.gitleaksignore', import.meta.url), 'utf8');
  const fixture = mkdtempSync(join(tmpdir(), 'gitleaks-readiness-policy-'));
  const report = join(fixture, 'report.json');
  const git = (...args) => spawnSync('git', args, { cwd: fixture, encoding: 'utf8' });
  const scan = () => spawnSync('gitleaks', [
    'detect', '--source', '.', '--config', config, '--redact', '--exit-code', '1',
    '--report-format', 'json', '--report-path', report,
  ], { cwd: fixture, encoding: 'utf8' });
  try {
    mkdirSync(join(fixture, 'platform/agents/readiness/readiness-security'), { recursive: true });
    writeFileSync(join(fixture, path), `${'\n'.repeat(35)}${historical}\n`);
    writeFileSync(join(fixture, '.gitleaksignore'), ignored);
    assert.equal(git('init', '-q').status, 0);
    assert.equal(git('add', path).status, 0);
    assert.equal(git('-c', 'user.name=Policy fixture', '-c', 'user.email=policy@example.invalid',
      'commit', '-qm', 'Synthetic public digest fixture').status, 0);
    const commit = git('rev-parse', 'HEAD').stdout.trim();
    assert.equal(scan().status, 1, 'A new commit with identical public bytes must remain blocking');
    const findings = JSON.parse(readFileSync(report, 'utf8'));
    assert.equal(findings.length, 1);
    const exact = `${commit}:${path}:generic-api-key:36`;
    assert.equal(findings[0].Fingerprint, exact);
    writeFileSync(join(fixture, '.gitleaksignore'), `${exact}\n`);
    assert.equal(scan().status, 0, 'Only the full exact fingerprint is admitted');
    const changedCommit = `${commit[0] === 'a' ? 'b' : 'a'}${commit.slice(1)}`;
    for (const other of [
      exact.replace(commit, changedCommit),
      exact.replace(path, `other/${path}`),
      exact.replace(':generic-api-key:', ':other-rule:'),
      exact.replace(/:36$/, ':37'),
    ]) {
      writeFileSync(join(fixture, '.gitleaksignore'), `${other}\n`);
      assert.equal(scan().status, 1, 'Changing any fingerprint dimension must remain blocking');
    }
    writeFileSync(join(fixture, path), `${'\n'.repeat(35)}${renamed}\n`);
    const current = spawnSync('gitleaks', [
      'detect', '--no-git', '--source', '.', '--config', config, '--redact', '--exit-code', '1',
    ], { cwd: fixture, encoding: 'utf8' });
    assert.equal(current.status, 0, 'The accurately named public digest is not a credential');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
