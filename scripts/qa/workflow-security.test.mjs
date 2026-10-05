import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const workflow = readFileSync(new URL('../../.github/workflows/codeql.yml', import.meta.url), 'utf8');
const gate = workflow.split('      - name: Fail on open critical/high CodeQL alerts\n')[1];
const run = gate.split('        run: |\n')[1].split('\n').map(line => line.startsWith('          ') ? line.slice(10) : line).join('\n');

function execute(pages, { failure = false, analysis = 'success' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'codeql-gate-'));
  try {
    const bin = join(root, 'bin');
    mkdirSync(bin);
    writeFileSync(join(root, 'pages.json'), JSON.stringify(pages));
    writeFileSync(join(bin, 'gh'), `#!/bin/bash
set -euo pipefail
printf '%s\\n' "$@" > "$TEST_ROOT/args"
[ "$TEST_FAIL" != true ] || exit 42
# Emulate CLI pagination/slurp; use real jq for the workflow's own filter.
paginate=false
slurp=false
while [ "$#" -gt 0 ]; do
  case "$1" in
    --paginate) paginate=true ;;
    --slurp) slurp=true ;;
  esac
  shift
done
[ "$paginate" = true ] && [ "$slurp" = true ] || exit 43
cat "$TEST_ROOT/pages.json"
`, { mode: 0o700 });
    const result = spawnSync('bash', ['-c', run], {
      encoding: 'utf8',
      env: {
        PATH: `${bin}:/usr/bin:/bin`,
        TEST_ROOT: root,
        TEST_FAIL: String(failure),
        ANALYZE_RESULT: analysis,
        GITHUB_REPOSITORY: 'szl-holdings/platform',
        REF: 'refs/pull/999/merge',
      },
    });
    const args = analysis === 'success' ? readFileSync(join(root, 'args'), 'utf8') : '';
    return { ...result, args };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const alert = severity => ({ number: 123, rule: { security_severity_level: severity, id: 'test/security' } });

test('gate uses the same PR merge ref as analysis, including fork PRs', () => {
  assert.match(gate, /REF: \$\{\{ github\.ref \}\}/);
  const result = execute([[]]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.args, /ref=refs\/pull\/999\/merge&/);
  assert.doesNotMatch(result.args, /refs\/heads\//);
});

test('high findings on later pages block merge', () => {
  const result = execute([Array.from({ length: 100 }, () => alert('low')), [alert('high')]]);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /found 1 open critical\/high/);
  assert.match(result.args, /--paginate\n--slurp\n/);
});

test('critical findings and analyzer failures block merge', () => {
  assert.equal(execute([[alert('critical')]]).status, 1);
  assert.equal(execute([[]], { analysis: 'failure' }).status, 1);
});

test('unavailable alert evidence blocks merge', () => {
  const result = execute([[]], { failure: true });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Unable to read CodeQL alerts/);
});

test('all low and medium pages allow the gate', () => {
  assert.equal(execute([[alert('low')], [alert('medium')]]).status, 0);
});

test('smoke checkout consumes the resolved SHA expression without persisted credentials', () => {
  const smoke = readFileSync(new URL('../../.github/workflows/post-deploy-smoke.yml', import.meta.url), 'utf8');
  assert.match(smoke, /ref: \$\{\{ env\.WORKFLOW_RUN_HEAD_SHA \}\}\n\s+persist-credentials: false/);
  assert.doesNotMatch(smoke, /ref: \$WORKFLOW_RUN_HEAD_SHA/);
});
