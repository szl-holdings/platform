import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  assert.equal(permittedPath.test('workers/alloy-vector-worker/src/backends.ts'), false);
  assert.equal(permittedPath.test('other/workers/alloy-vector-worker/src/tokenizer.ts'), false);
  assert.equal(permittedLine.test(line.replace('751bff', '851bff')), false);
  assert.equal(permittedLine.test(line.replace('DEFAULT_TOKENIZER_REVISION', 'API_KEY')), false);
  assert.equal(permittedLine.test(`${line} const API_KEY = 'another-value';`), false);
});
