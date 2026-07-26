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
    ci_workflows: {
      value: 45,
      label: 'MEASURED',
      source: 'GitHub Actions workflow inventory',
    },
    platform_tests: {
      passed: 100,
      total: 105,
      label: 'MEASURED',
      source: 'test results',
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

test('rejects a stale measured workspace package claim', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/investor/platform-thesis.md',
      ['| pnpm workspace packages | 197 measured in `artifacts/SOURCE_OF_TRUTH.json` |'],
      metrics(12),
      [],
    ),
    ['docs/investor/platform-thesis.md:1: hardcoded 197; canonical value for this context is 199'],
  );
});

test('does not treat an @workspace package identifier as estate-wide context', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/aef/implementation-plan.md',
      ['| `@workspace/aef-workflow-runtime` | Ships 5 workflows and 8 actor roles. |'],
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

test('rejects a stale package claim wrapped across three prose lines', () => {
  const failures = claimFailuresForLines(
    'docs/wrapped.md',
    ['The current monorepo contains', '197 workspace', 'packages.'],
    metrics(12),
    [],
  );

  assert.deepEqual(failures, [
    'docs/wrapped.md:2: hardcoded 197; canonical value for this context is 199',
  ]);
});

test('uses the total test count for total-count wording', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/testing.md',
      ['The current platform has 105 total tests.'],
      metrics(12),
      [],
    ),
    [],
  );
  assert.deepEqual(
    claimFailuresForLines(
      'docs/testing.md',
      ['The current platform has 104 total tests.'],
      metrics(12),
      [],
    ),
    ['docs/testing.md:1: hardcoded 104; canonical value for this context is 105'],
  );
});

test('uses the total test count for postpositive total wording', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/testing.md',
      ['The current platform has 105 tests in total.'],
      metrics(12),
      [],
    ),
    [],
  );
  assert.deepEqual(
    claimFailuresForLines(
      'docs/testing.md',
      ['The current platform has 100 tests in total.'],
      metrics(12),
      [],
    ),
    ['docs/testing.md:1: hardcoded 100; canonical value for this context is 105'],
  );
});

test('classifies total and passing counts from their own clauses', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/testing.md',
      ['The current platform has 105 tests in total (100 passing).'],
      metrics(12),
      [],
    ),
    [],
  );
  assert.deepEqual(
    claimFailuresForLines(
      'docs/testing.md',
      ['The current platform has 100 tests in total (99 passing).'],
      metrics(12),
      [],
    ),
    [
      'docs/testing.md:1: hardcoded 100; canonical value for this context is 105',
      'docs/testing.md:1: hardcoded 99; canonical value for this context is 100',
    ],
  );
});

test('uses the passed test count for passing wording', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/testing.md',
      ['The current platform has 100 passing tests.'],
      metrics(12),
      [],
    ),
    [],
  );
});

test('does not join separate TSX string expressions into one claim context', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'artifacts/example/src/claims.tsx',
      [
        'const labels = [',
        "  'Current release notes',",
        "  'Guardian engine',",
        "  'ships 35 tests',",
        '];',
      ],
      metrics(12),
      [],
    ),
    [],
  );
});

test('does not join separate JSX attribute expressions into one claim context', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'artifacts/example/src/claims.tsx',
      ['<Card', '  title="Current release notes"', '  description="Guardian ships 35 tests"', '/>'],
      metrics(12),
      [],
    ),
    [],
  );
});

test('does not reinterpret scoped or timing numbers as platform test totals', () => {
  const scopedClaims = [
    'The 10-minute path ends with tests passing.',
    'pytest tests/ -q # 4 passed',
    '13 / 13 adapter tests passing on the pinned subsystem commit.',
  ];

  for (const scopedClaim of scopedClaims) {
    assert.deepEqual(
      claimFailuresForLines('docs/scoped-testing.md', [scopedClaim], metrics(12), []),
      [],
    );
  }
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

test('does not recontextualize a complete claim using the next prose line', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/runbook.md',
      [
        'Rate limits allow 5 requests per minute.',
        'Canonical active surfaces are documented below.',
      ],
      {
        ...metrics(12),
        surfaces_customer_facing: {
          value: 99,
          label: 'MEASURED',
          source: 'surface inventory',
        },
      },
      [],
    ),
    [],
  );
});
