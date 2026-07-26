import assert from 'node:assert/strict';
import test from 'node:test';
import { REQUIRED_METRICS, validateTruth } from './validate-truth.ts';

const NOW = Date.parse('2026-07-25T22:00:00.000Z');

function validTruth(): Record<string, unknown> {
  const metrics = Object.fromEntries(
    REQUIRED_METRICS.map((name) => [
      name,
      name === 'platform_tests' || name === 'ouroboros_tests' || name === 'mcp_e2e_tests'
        ? {
            passed: 3,
            total: 4,
            label: 'MEASURED',
            source: 'test source',
            definition: 'test definition',
          }
        : {
            value: name === 'ghcr_a11oy_package_live' ? true : 1,
            label: 'MEASURED',
            source: 'metric source',
            definition: 'metric definition',
          },
    ]),
  );
  return {
    schema: 'szl.truth/v1',
    generated_at: new Date(NOW).toISOString(),
    generated_by: 'a'.repeat(40),
    metrics,
  };
}

test('accepts the complete canonical metric contract', () => {
  assert.deepEqual(validateTruth(validTruth(), NOW), []);
});

test('rejects a missing canonical metric', () => {
  const truth = validTruth();
  delete (truth.metrics as Record<string, unknown>).hf_models;
  assert.ok(validateTruth(truth, NOW).includes('metrics.hf_models is required'));
});

test('rejects timestamps more than five minutes in the future', () => {
  const truth = validTruth();
  truth.generated_at = new Date(NOW + 5 * 60 * 1000 + 1).toISOString();
  assert.ok(
    validateTruth(truth, NOW).includes('generated_at is more than five minutes in the future'),
  );
});

test('rejects malformed available scalar values', () => {
  const truth = validTruth();
  (truth.metrics as Record<string, Record<string, unknown>>).hf_models.value = '15';
  assert.ok(
    validateTruth(truth, NOW).includes('hf_models value must be a non-negative integer count'),
  );
});

test('rejects malformed available test summaries', () => {
  const truth = validTruth();
  const platform = (truth.metrics as Record<string, Record<string, unknown>>).platform_tests;
  platform.passed = 5;
  platform.total = 4;
  assert.ok(validateTruth(truth, NOW).includes('platform_tests passed cannot exceed total'));
});

test('rejects mixed scalar and test evidence shapes', () => {
  const truth = validTruth();
  const metrics = truth.metrics as Record<string, Record<string, unknown>>;
  metrics.hf_models.passed = 15;
  metrics.hf_models.total = 15;
  metrics.platform_tests.value = 3;

  const failures = validateTruth(truth, NOW);
  assert.ok(failures.includes('hf_models must use exactly one scalar evidence shape'));
  assert.ok(failures.includes('platform_tests must use exactly one test evidence shape'));
});

test('rejects missing scalar and test evidence fields', () => {
  const truth = validTruth();
  const metrics = truth.metrics as Record<string, Record<string, unknown>>;
  delete metrics.hf_models.value;
  delete metrics.platform_tests.total;

  const failures = validateTruth(truth, NOW);
  assert.ok(failures.includes('hf_models must use exactly one scalar evidence shape'));
  assert.ok(failures.includes('platform_tests must use exactly one test evidence shape'));
});
