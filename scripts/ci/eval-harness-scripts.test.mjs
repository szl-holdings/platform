import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const manifest = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

const evalHarnessScripts = {
  'eval-harness:run-standard': {
    command: 'node ops/python/run-python.mjs -m pytest -q apps/eval-runner/test_app_eval.py',
    target: 'apps/eval-runner/test_app_eval.py',
  },
  'eval-harness:reproduce': {
    command:
      'node ops/python/run-python.mjs -m pytest -q apps/eval-runner/test_suite_reproducibility.py',
    target: 'apps/eval-runner/test_suite_reproducibility.py',
  },
};

test('eval harness aliases invoke the checked-in Python harness', () => {
  for (const [scriptName, expected] of Object.entries(evalHarnessScripts)) {
    assert.equal(manifest.scripts?.[scriptName], expected.command, `${scriptName} target drifted`);
    assert.equal(
      existsSync(path.join(repoRoot, expected.target)),
      true,
      `${scriptName} target is missing: ${expected.target}`,
    );
  }
});

test('eval harness aliases do not reference the nonexistent workspace package', () => {
  for (const scriptName of Object.keys(evalHarnessScripts)) {
    assert.doesNotMatch(manifest.scripts[scriptName], /@workspace\/eval-harness/);
  }
});
