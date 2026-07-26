import assert from 'node:assert/strict';
import test from 'node:test';

import { type AllowEntry, claimFailuresForLines, claimIdentitiesForLines } from './claims-drift.js';

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
  const baselineIdentities = claimIdentitiesForLines('docs/investor.md', [claim], metrics(null));

  assert.deepEqual(
    claimFailuresForLines(
      'docs/investor.md',
      [claim],
      metrics(null),
      allowlist,
      baselineIdentities,
    ),
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

test('does not let an allowlist entry cover a new same-literal claim in the same file', () => {
  const baselineLines = ['Historical subsystem evidence records 5,524 current API endpoints.'];
  const currentLines = [
    ...baselineLines,
    'The platform currently exposes 5,524 current API endpoints.',
  ];
  const allowlist: AllowEntry[] = [{ path: 'docs/investor.md', literal: '5,524' }];
  const baselineIdentities = claimIdentitiesForLines(
    'docs/investor.md',
    baselineLines,
    metrics(null),
  );

  assert.deepEqual(
    claimFailuresForLines(
      'docs/investor.md',
      currentLines,
      metrics(null),
      allowlist,
      baselineIdentities,
    ),
    ['docs/investor.md:2: hardcoded 5,524; canonical evidence for api_endpoints is UNAVAILABLE'],
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

test('does not join separate inline HTML or JSX sibling elements into one claim context', () => {
  for (const relative of ['artifacts/example/claims.html', 'artifacts/example/src/claims.tsx']) {
    assert.deepEqual(
      claimFailuresForLines(
        relative,
        [
          '<div>',
          '<span>Current release notes</span>',
          '<span>Guardian ships 35 tests</span>',
          '</div>',
        ],
        metrics(12),
        [],
      ),
      [],
    );
  }
});

test('does not carry claim context across separate Markdown blockquote lines', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/quotes.md',
      ['> Current release notes', '> Guardian ships 35 tests'],
      metrics(12),
      [],
    ),
    [],
  );
});

test('scans stale metrics through inline Markdown, HTML, and JSX markup', () => {
  const cases: Array<[string, string[]]> = [
    ['docs/markup.md', ['The current platform has **198** monorepo packages.']],
    ['docs/markup.md', ['The current platform has [198](https://example.com) monorepo packages.']],
    [
      'artifacts/example/claims.html',
      ['<p>The current platform has <strong>198</strong> monorepo packages.</p>'],
    ],
    [
      'artifacts/example/src/claims.tsx',
      ['<p>', 'Current platform has', '<strong>198</strong>', 'monorepo packages', '</p>'],
    ],
    [
      'artifacts/example/src/claims.tsx',
      ['<p>The current platform has {198} monorepo packages.</p>'],
    ],
  ];

  for (const [relative, lines] of cases) {
    assert.deepEqual(claimFailuresForLines(relative, lines, metrics(12), []), [
      `${relative}:${lines.length === 5 ? 3 : 1}: hardcoded 198; canonical value for this context is 199`,
    ]);
  }
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

test('classifies comma and conjunction compound test counts independently', () => {
  for (const claimText of [
    'The current platform has 105 tests in total, 99 passing.',
    'The current platform reports 105 tests total and 99 passing.',
  ]) {
    assert.deepEqual(claimFailuresForLines('docs/testing.md', [claimText], metrics(12), []), [
      'docs/testing.md:1: hardcoded 99; canonical value for this context is 100',
    ]);
  }
});

test('classifies ratio and out-of test counts as passed over total', () => {
  for (const claimText of [
    'The current platform has 100 of 105 tests passing.',
    'The current platform has 100 / 105 tests passed.',
    'The current platform has 100 passed out of 105 tests.',
  ]) {
    assert.deepEqual(claimFailuresForLines('docs/testing.md', [claimText], metrics(12), []), []);
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

test('does not treat scoped package labels or date columns as monorepo package totals', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/table.md',
      [
        '| Shared TypeScript packages | 40 | In `lib/` monorepo |',
        '| Organization setup package | 2026-04 |',
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

test('scans singular metric nouns', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/workflows.md',
      ['The current estate has 1 workflow.'],
      {
        ...metrics(12),
        ci_workflows: {
          value: 45,
          label: 'MEASURED',
          source: 'workflow inventory',
        },
      },
      [],
    ),
    ['docs/workflows.md:1: hardcoded 1; canonical value for this context is 45'],
  );
});

test('scans numeric claim headings while ignoring genuine ordinal heading labels', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/headings.md',
      ['## 198 total monorepo packages', '## 1. Tests'],
      metrics(12),
      [],
    ),
    ['docs/headings.md:1: hardcoded 198; canonical value for this context is 199'],
  );
});

test('does not reinterpret tier identifiers as customer-facing surface totals', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/product.md',
      ['No Tier 1 surface should carry real estate content without explicit cross-domain framing.'],
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

test('keeps adversarial wrapped-block scanning time bounded', { timeout: 2_000 }, () => {
  const lines = Array.from({ length: 2_000 }, () => 'Current platform has 199 packages');
  const started = performance.now();

  assert.deepEqual(claimFailuresForLines('docs/generated.md', lines, metrics(12), []), []);
  assert.ok(performance.now() - started < 1_500);
});
