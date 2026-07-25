import assert from 'node:assert/strict';
import test from 'node:test';
import { comparableTruth, countWorkspacePackages, parseTestSummary } from './generate-truth.ts';

test('parseTestSummary reads Vitest/Jest summary fields', () => {
  assert.deepEqual(parseTestSummary({ numPassedTests: 7, numTotalTests: 9 }), {
    passed: 7,
    total: 9,
  });
});

test('parseTestSummary reads assertion results', () => {
  assert.deepEqual(
    parseTestSummary({
      testResults: [
        {
          assertionResults: [{ status: 'passed' }, { status: 'failed' }, { status: 'passed' }],
        },
      ],
    }),
    { passed: 2, total: 3 },
  );
});

test('comparableTruth ignores generation metadata only', () => {
  const first = {
    schema: 'szl.truth/v1',
    generated_at: 'one',
    generated_by: 'aaa',
    metrics: { example: { value: 1 } },
  };
  const second = {
    schema: 'szl.truth/v1',
    generated_at: 'two',
    generated_by: 'bbb',
    metrics: { example: { value: 1 } },
  };
  assert.deepEqual(comparableTruth(first), comparableTruth(second));
});

test('workspace package count is non-zero in the platform checkout', () => {
  assert.ok(countWorkspacePackages() > 0);
});
