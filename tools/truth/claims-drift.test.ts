import assert from 'node:assert/strict';
import test from 'node:test';

import { type AllowEntry, claimFailuresForLines } from './claims-drift.js';

function metrics(apiEndpointValue: number | null): Record<string, Record<string, unknown>> {
  return {
    api_endpoints:
      apiEndpointValue === null
        ? { value: null, label: 'UNAVAILABLE', source: 'runtime router inventory' }
        : { value: apiEndpointValue, label: 'MEASURED', source: 'runtime router inventory' },
  };
}

const claim = 'The platform currently exposes 5,524 current API endpoints.';

test('rejects a numeric claim when canonical evidence is UNAVAILABLE', () => {
  const failures = claimFailuresForLines('docs/investor.md', [claim], metrics(null), []);

  assert.deepEqual(failures, [
    'docs/investor.md:1: hardcoded 5,524; canonical evidence for api_endpoints is UNAVAILABLE',
  ]);
});

test('allows an unavailable numeric claim only through an explicit path and literal entry', () => {
  const allowlist: AllowEntry[] = [{ path: 'docs/investor.md', literal: '5,524' }];

  assert.deepEqual(
    claimFailuresForLines('docs/investor.md', [claim], metrics(null), allowlist),
    [],
  );
});

test('does not let an allowlist entry cover a different path', () => {
  const allowlist: AllowEntry[] = [{ path: 'docs/other.md', literal: '5,524' }];

  assert.equal(
    claimFailuresForLines('docs/investor.md', [claim], metrics(null), allowlist).length,
    1,
  );
});

test('continues to reject stale numeric claims when canonical evidence is available', () => {
  const failures = claimFailuresForLines('docs/investor.md', [claim], metrics(12), []);

  assert.deepEqual(failures, [
    'docs/investor.md:1: hardcoded 5,524; canonical value for this context is 12',
  ]);
});

test('accepts a numeric claim that matches available canonical evidence', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/investor.md',
      ['The platform currently exposes 12 API endpoints.'],
      metrics(12),
      [],
    ),
    [],
  );
});

test('rejects a stale claim split across adjacent prose lines', () => {
  const splitMetrics = {
    ...metrics(12),
    monorepo_packages: {
      value: 199,
      label: 'MEASURED',
      source: 'workspace package inventory',
    },
  };
  const failures = claimFailuresForLines(
    'docs/investor.md',
    ['The estate currently has 198', 'monorepo packages under governance.'],
    splitMetrics,
    [],
  );

  assert.deepEqual(failures, [
    'docs/investor.md:1: hardcoded 198; canonical value for this context is 199',
  ]);
});

test('does not recontextualize a complete claim using the next prose line', () => {
  const splitMetrics = {
    ...metrics(12),
    surfaces_customer_facing: {
      value: 99,
      label: 'MEASURED',
      source: 'surface inventory',
    },
  };

  assert.deepEqual(
    claimFailuresForLines(
      'docs/runbook.md',
      [
        'Rate limits allow 5 requests per minute.',
        'Canonical active surfaces are documented below.',
      ],
      splitMetrics,
      [],
    ),
    [],
  );
});
