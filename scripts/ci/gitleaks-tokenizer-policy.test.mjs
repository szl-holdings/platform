import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('only the exact public tokenizer revision assignment is exempted from generic-api-key', () => {
  const config = readFileSync(new URL('../../.gitleaks.toml', import.meta.url), 'utf8');
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
