import assert from 'node:assert/strict';
import test from 'node:test';

import { metricDrift } from './generate-truth.js';
import { REMOTE_METRIC_NAMES } from './truth-schema.js';

const unavailable = {
  value: null,
  label: 'UNAVAILABLE',
  source: 'independent source unavailable',
};

function remoteMetrics(): Record<string, unknown> {
  return Object.fromEntries(REMOTE_METRIC_NAMES.map((name) => [name, { ...unavailable }]));
}

test('rejects a committed remote metric that differs from independent recomputation', () => {
  const committed = remoteMetrics();
  const recomputed = remoteMetrics();
  committed.hf_models = {
    value: 999,
    label: 'MEASURED',
    source: 'author-controlled committed value',
  };
  recomputed.hf_models = {
    value: 15,
    label: 'MEASURED',
    source: 'Hugging Face Hub API',
  };

  assert.deepEqual(metricDrift(committed, recomputed, REMOTE_METRIC_NAMES), ['hf_models']);
});

test('rejects a numeric remote claim when its independent source is unavailable', () => {
  const committed = remoteMetrics();
  const recomputed = remoteMetrics();
  committed.receipt_chain_depth = {
    value: 42,
    label: 'MEASURED',
    source: 'committed receipt depth',
  };

  assert.deepEqual(metricDrift(committed, recomputed, REMOTE_METRIC_NAMES), [
    'receipt_chain_depth',
  ]);
});

test('accepts remote metrics only when all evidence objects match recomputation', () => {
  const committed = remoteMetrics();
  const recomputed = remoteMetrics();

  assert.deepEqual(metricDrift(committed, recomputed, REMOTE_METRIC_NAMES), []);
});
