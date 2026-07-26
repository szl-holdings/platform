import assert from 'node:assert/strict';
import test from 'node:test';

import { CANONICAL_METRIC_NAMES } from './truth-schema.js';
import { validateTruth } from './validate-truth.js';

const NOW = Date.parse('2026-07-26T02:30:00Z');

function validTruth(): Record<string, unknown> {
  return {
    schema: 'szl.truth/v1',
    generated_at: new Date(NOW).toISOString(),
    generated_by: '36e924f2c8ec34d7e725fa1da6606dfa609e9eda',
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
