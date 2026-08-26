import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { CANONICAL_METRIC_NAMES, TRUTH_GENERATOR_ID } from './truth-schema.js';
import { validateTruth } from './validate-truth.js';

const NOW = Date.parse('2026-07-26T02:30:00Z');

function validTruth(): Record<string, unknown> {
  return {
    schema: 'szl.truth/v1',
    generated_at: new Date(NOW).toISOString(),
    generated_by: TRUTH_GENERATOR_ID,
    metrics: Object.fromEntries(
      CANONICAL_METRIC_NAMES.map((name) => [
        name,
        { value: null, label: 'UNAVAILABLE', source: `test source for ${name}` },
      ]),
    ),
  };
}

test('accepts a complete canonical metric set', () => {
  assert.deepEqual(validateTruth(validTruth(), NOW), []);
});

test('rejects a missing canonical metric', () => {
  const truth = validTruth();
  delete (truth.metrics as Record<string, unknown>).hf_models;
  assert.ok(
    validateTruth(truth, NOW).some((failure) =>
      failure.includes('hf_models is missing; use an explicit UNAVAILABLE'),
    ),
  );
});

test('rejects an unknown metric', () => {
  const truth = validTruth();
  (truth.metrics as Record<string, unknown>).invented_metric = {
    value: 1,
    label: 'MEASURED',
    source: 'test',
  };
  assert.ok(
    validateTruth(truth, NOW).some((failure) =>
      failure.includes('invented_metric is not a canonical metric'),
    ),
  );
});

test('rejects a generated_at timestamp beyond the allowed future skew', () => {
  const truth = validTruth();
  truth.generated_at = new Date(NOW + 5 * 60 * 1000 + 1).toISOString();
  assert.ok(
    validateTruth(truth, NOW).some((failure) =>
      failure.includes('more than five minutes in the future'),
    ),
  );
});

test('keeps honest historical truth out of the structural PR gate', () => {
  const truth = validTruth();
  truth.generated_at = new Date(NOW - 7 * 24 * 60 * 60 * 1000 - 1).toISOString();
  assert.deepEqual(validateTruth(truth, NOW), []);
  assert.deepEqual(validateTruth(truth, NOW, { requireFreshness: true }), [
    'generated_at is older than seven days',
  ]);
});

test('enforces the exact truth-snapshot freshness boundary', () => {
  const truth = validTruth();
  truth.generated_at = new Date(NOW - 7 * 24 * 60 * 60 * 1000).toISOString();
  assert.deepEqual(validateTruth(truth, NOW, { requireFreshness: true }), []);
});

test('wires truth freshness only to scheduled and explicit manual events', () => {
  const workflow = readFileSync('.github/workflows/truth-drift.yml', 'utf8');
  assert.match(
    workflow,
    /require_truth_freshness:\n\s+description: Require the generated truth snapshot to be no older than seven days\n\s+required: false\n\s+default: false\n\s+type: boolean/,
  );
  assert.match(
    workflow,
    /- name: Require a current generated truth snapshot\n\s+if: >-\n\s+github\.event_name == 'schedule' \|\|\n\s+\(github\.event_name == 'workflow_dispatch' && inputs\.require_truth_freshness\)\n\s+run: pnpm truth:freshness/,
  );
});

test('rejects noncanonical generator provenance', () => {
  const truth = validTruth();
  truth.generated_by = '36e924f2c8ec34d7e725fa1da6606dfa609e9eda';
  assert.ok(
    validateTruth(truth, NOW).some((failure) =>
      failure.includes(`generated_by must equal ${TRUTH_GENERATOR_ID}`),
    ),
  );
});

test('accepts finite numeric scalar and test evidence', () => {
  const truth = validTruth();
  const metrics = truth.metrics as Record<string, unknown>;
  metrics.hf_models = { value: 15, label: 'MEASURED', source: 'fixture' };
  metrics.platform_tests = { passed: 44, total: 44, label: 'MEASURED', source: 'fixture' };
  assert.deepEqual(validateTruth(truth, NOW), []);
});

for (const malformed of ['15', null, undefined]) {
  test(`rejects malformed available scalar evidence: ${String(malformed)}`, () => {
    const truth = validTruth();
    (truth.metrics as Record<string, unknown>).hf_models = {
      ...(malformed === undefined ? {} : { value: malformed }),
      label: 'MEASURED',
      source: 'fixture',
    };
    assert.ok(
      validateTruth(truth, NOW).some((failure) =>
        failure.includes('hf_models must use one finite numeric scalar or test evidence shape'),
      ),
    );
  });
}

test('rejects malformed available test evidence', () => {
  const truth = validTruth();
  (truth.metrics as Record<string, unknown>).platform_tests = {
    passed: 44,
    total: '44',
    label: 'MEASURED',
    source: 'fixture',
  };
  assert.ok(
    validateTruth(truth, NOW).some((failure) =>
      failure.includes('platform_tests must use one finite numeric scalar or test evidence shape'),
    ),
  );
});
