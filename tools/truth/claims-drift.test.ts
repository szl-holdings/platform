import assert from 'node:assert/strict';
import test from 'node:test';

import { type AllowEntry, claimFailuresForLines } from './claims-drift.js';

function metrics(
  apiEndpointValue: number | null,
  packageValue = 199,
): Record<string, Record<string, unknown>> {
  return {
    api_endpoints:
      apiEndpointValue === null
        ? { value: null, label: 'UNAVAILABLE', source: 'runtime router inventory' }
        : { value: apiEndpointValue, label: 'MEASURED', source: 'runtime router inventory' },
    monorepo_packages: {
      value: packageValue,
      label: 'MEASURED',
      source: 'pnpm recursive workspace list',
    },
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

test('rejects a stale package claim split across adjacent prose lines', () => {
  const failures = claimFailuresForLines(
    'docs/wrapped.md',
    ['The platform currently has 198', 'monorepo packages.'],
    metrics(12),
    [],
  );

  assert.deepEqual(failures, [
    'docs/wrapped.md:1: hardcoded 198; canonical value for this context is 199',
  ]);
});

test('retains the numeric source line when a wrapped claim puts the value second', () => {
  const failures = claimFailuresForLines(
    'docs/wrapped.md',
    ['Monorepo packages total:', '198'],
    metrics(12),
    [],
  );

  assert.deepEqual(failures, [
    'docs/wrapped.md:2: hardcoded 198; canonical value for this context is 199',
  ]);
});

test('accepts a matching package claim split across adjacent prose lines', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/wrapped.md',
      ['The platform currently has 199', 'monorepo packages.'],
      metrics(12),
      [],
    ),
    [],
  );
});

test('does not combine separate Markdown table rows into one claim', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/table.md',
      [
        '| Monorepo packages | 199 |',
        '| Historical package subtotal | 51 |',
        '| API endpoints | 12 |',
      ],
      metrics(12),
      [],
    ),
    [],
  );
});

test('does not carry claim context across separate list items', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/list.md',
      [
        '- The current monorepo uses pnpm.',
        '- A historical subsystem contains 51 packages.',
        '- The canonical estate has 199 packages.',
      ],
      metrics(12),
      [],
    ),
    [],
  );
});

test('still scans a wrapped continuation inside one list item', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/list.md',
      ['- The platform currently has 198', '  monorepo packages.'],
      metrics(12),
      [],
    ),
    ['docs/list.md:1: hardcoded 198; canonical value for this context is 199'],
  );
});
