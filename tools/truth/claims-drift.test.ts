import assert from 'node:assert/strict';
import test from 'node:test';

import {
  type AllowEntry,
  claimFailuresForLines,
  claimIdentitiesForLines,
  selectNonHeadBaselineCandidate,
  semanticDecodeWindowMaxSourceLength,
  semanticSourceSpanCount,
  validateImmutableBaselineCandidate,
} from './claims-drift.js';

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

test('does not let one allowlisted occurrence cover a byte-identical duplicate', () => {
  const baselineLines = ['The platform currently exposes 5,524 current API endpoints.'];
  const currentLines = [...baselineLines, ...baselineLines];
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

test('does not let an allowlisted historical claim relocate under a current heading', () => {
  const baselineLines = [
    '## Historical record',
    'The platform currently exposes 5,524 current API endpoints.',
  ];
  const currentLines = [
    '## Current platform',
    'The platform currently exposes 5,524 current API endpoints.',
  ];
  const allowlist: AllowEntry[] = [{ path: 'docs/investor.md', literal: '*' }];
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

test('binds allowlisted claims to Setext and blockquoted heading scopes', () => {
  const allowlist: AllowEntry[] = [{ path: 'docs/investor.md', literal: '*' }];
  const cases: Array<[string[], string[]]> = [
    [
      ['Historical record', '=================', claim],
      ['Current platform', '================', claim],
    ],
    [
      ['> ## Historical record', `> ${claim}`],
      ['> ## Current platform', `> ${claim}`],
    ],
    [
      ['> Historical record', '> =================', `> ${claim}`],
      ['> Current platform', '> ================', `> ${claim}`],
    ],
  ];

  for (const [baselineLines, currentLines] of cases) {
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
      [
        `docs/investor.md:${currentLines.length}: hardcoded 5,524; canonical evidence for api_endpoints is UNAVAILABLE`,
      ],
    );
  }
});

test('accepts only a full immutable ancestor distinct from current HEAD', () => {
  const baseline = 'a'.repeat(40);
  const head = 'b'.repeat(40);

  assert.equal(validateImmutableBaselineCandidate(baseline, baseline, head, true), baseline);
  assert.throws(
    () => validateImmutableBaselineCandidate('main', baseline, head, true),
    /full nonzero commit SHA/,
  );
  assert.throws(
    () => validateImmutableBaselineCandidate('abc123', baseline, head, true),
    /full nonzero commit SHA/,
  );
  assert.throws(
    () => validateImmutableBaselineCandidate(head, head, head, true),
    /must not resolve to current HEAD/,
  );
  assert.throws(
    () => validateImmutableBaselineCandidate(baseline, baseline, head, false),
    /must be an ancestor/,
  );
});

test('uses the first parent when the main merge base is current HEAD', () => {
  const head = 'b'.repeat(40);
  const parent = 'a'.repeat(40);

  assert.equal(selectNonHeadBaselineCandidate(parent, head, undefined), parent);
  assert.equal(selectNonHeadBaselineCandidate(head, head, parent), parent);
  assert.throws(
    () => selectNonHeadBaselineCandidate(head, head, undefined),
    /no immutable ancestor baseline/,
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
    [
      'artifacts/example/src/claims.tsx',
      [
        '<p><span>The current platform has</span><strong>198</strong><span>monorepo packages.</span></p>',
      ],
    ],
  ];

  for (const [relative, lines] of cases) {
    assert.deepEqual(claimFailuresForLines(relative, lines, metrics(12), []), [
      `${relative}:${lines.length === 5 ? 3 : 1}: hardcoded 198; canonical value for this context is 199`,
    ]);
  }
});

test('normalizes static JSX string expressions around claim values and nouns', () => {
  for (const source of [
    "<p>The current monorepo has {'198'} packages.</p>",
    "<p>The current monorepo has 198 {'packages'}.</p>",
  ]) {
    assert.deepEqual(claimFailuresForLines('src/Claim.tsx', [source], metrics(12), []), [
      'src/Claim.tsx:1: hardcoded 198; canonical value for this context is 199',
    ]);
  }
});

test('preserves semantic claim continuity across custom components and inert JSX gaps', () => {
  for (const source of [
    '<Text>The current platform has</Text><MetricValue>198</MetricValue><Text>monorepo packages.</Text>',
    "<span>The current platform exposes</span>{' '}<strong>198</strong><span>API endpoints.</span>",
    '<span>The current platform exposes</span>{/* visual gap */}<strong>198</strong><span>API endpoints.</span>',
    '<span>The current platform supports</span><strong>198</strong><span>API endpoints.</span>',
  ]) {
    assert.deepEqual(claimFailuresForLines('src/Claim.tsx', [source], metrics(12), []), [
      `src/Claim.tsx:1: hardcoded 198; canonical value for this context is ${
        source.includes('packages') ? 199 : 12
      }`,
    ]);
  }
});

test('assembles styled claims across phrasing text nodes and nested value wrappers', () => {
  for (const source of [
    '<p>The current platform <Text>supports</Text><MetricValue>198</MetricValue><Text>API endpoints.</Text></p>',
    '<p><Text>The current platform</Text><Text>supports</Text><MetricValue>198</MetricValue><Text>API endpoints.</Text></p>',
    '<p><Text>The current platform supports</Text><MetricValue><strong>198</strong></MetricValue><Text>API endpoints.</Text></p>',
    '<p><Text>The current platform supports</Text><MetricValue>{/* display */}198</MetricValue><Text>API endpoints.</Text></p>',
    '<p><Text>The current platform supports</Text><MetricValue>{198}</MetricValue><Text>API endpoints.</Text></p>',
    "<p><Text>The current platform supports</Text><MetricValue>{'198'}</MetricValue><Text>API endpoints.</Text></p>",
  ]) {
    assert.deepEqual(claimFailuresForLines('src/Claim.tsx', [source], metrics(12), []), [
      'src/Claim.tsx:1: hardcoded 198; canonical value for this context is 12',
    ]);
  }
});

test('keeps styled claim assembly within one parent and across no explicit separator', () => {
  for (const source of [
    '<Stack><Text>Current release notes</Text><Panel><Metric>35</Metric><Text>tests from the Guardian archive</Text></Panel></Stack>',
    '<div><span>Current release notes</span><span><strong>35</strong><em>tests from the Guardian archive</em></span></div>',
    '<p><span>Current release notes</span>{/* separate */}<strong>35</strong><span>tests from the Guardian archive</span></p>',
    '<p><span>Current release notes</span><br/><strong>35</strong><span>tests from the Guardian archive</span></p>',
  ]) {
    assert.deepEqual(claimFailuresForLines('src/Claim.tsx', [source], metrics(12), []), []);
  }
});

test('covers a representative parent-aware styled-claim matrix', () => {
  const contexts = [
    'The current platform supports',
    '<Text>The current platform supports</Text>',
    '<Text>The current platform</Text><Text>supports</Text>',
  ];
  const values = [
    '<MetricValue>198</MetricValue>',
    '<MetricValue><strong>198</strong></MetricValue>',
    '<MetricValue>{/* display */}198</MetricValue>',
    '<MetricValue>{198}</MetricValue>',
    "<MetricValue>{'198'}</MetricValue>",
    '<MetricValue>198</MetricValue>{/*c*/}',
  ];
  const metricsMarkup = ['<Text>API endpoints.</Text>', '<Text><em>API endpoints.</em></Text>'];

  for (const context of contexts) {
    for (const value of values) {
      for (const metric of metricsMarkup) {
        const source = `<p>${context}${value}${metric}</p>`;
        assert.deepEqual(
          claimFailuresForLines('src/Claim.tsx', [source], metrics(12), []),
          ['src/Claim.tsx:1: hardcoded 198; canonical value for this context is 12'],
          source,
        );
      }
    }
  }
});

test('does not treat a current-platform guide label as an assertion antecedent', () => {
  for (const parent of ['div', 'p', 'Stack']) {
    const source = `<${parent}><Text>Current platform guide</Text><Metric>35</Metric><Text>tests from the Guardian archive</Text></${parent}>`;
    assert.deepEqual(claimFailuresForLines('src/Claim.tsx', [source], metrics(12), []), []);
  }
});

test('decodes decimal and hexadecimal numeric HTML entities without losing attribution', () => {
  for (const claimText of [
    '<p>The current monorepo has &#49;&#57;&#56; packages.</p>',
    '<p>The current monorepo has &#x31;&#x39;&#x38; packages.</p>',
    '<p>The current monorepo has &#49&#57&#56 packages.</p>',
    '<p>The current monorepo has &#x31&#x39&#x38 packages.</p>',
    '<p>The current monorepo has １９８ packages.</p>',
  ]) {
    assert.deepEqual(claimFailuresForLines('docs/entities.html', [claimText], metrics(12), []), [
      'docs/entities.html:1: hardcoded 198; canonical value for this context is 199',
    ]);
  }
});

test('normalizes Unicode decimal digits from raw text and numeric entities', () => {
  for (const claimText of [
    '<p>The current monorepo has \u0661\u0669\u0668 packages.</p>',
    '<p>The current monorepo has \u06f1\u06f9\u06f8 packages.</p>',
    '<p>The current monorepo has &#1633;&#1641;&#1640; packages.</p>',
    '<p>The current monorepo has &#x661;&#x669;&#x668; packages.</p>',
  ]) {
    assert.deepEqual(claimFailuresForLines('docs/entities.html', [claimText], metrics(12), []), [
      'docs/entities.html:1: hardcoded 198; canonical value for this context is 199',
    ]);
  }
});

test('normalizes every new Unicode decimal block exposed by the Node 24 runtime', () => {
  for (const zero of [
    0x10d40, 0x116d0, 0x116da, 0x11bf0, 0x11de0, 0x16130, 0x16d70, 0x1ccf0, 0x1e5f1,
  ]) {
    const rawDigits = String.fromCodePoint(zero + 1, zero + 9, zero + 8);
    const entityDigits = [zero + 1, zero + 9, zero + 8]
      .map((codePoint) => `&#x${codePoint.toString(16)};`)
      .join('');
    for (const digits of [rawDigits, entityDigits]) {
      assert.deepEqual(
        claimFailuresForLines(
          'docs/entities.html',
          [`<p>The current monorepo has ${digits} packages.</p>`],
          metrics(12),
          [],
        ),
        ['docs/entities.html:1: hardcoded 198; canonical value for this context is 199'],
      );
    }
  }
});

test('does not let a plain allowlisted claim authorize an encoded equivalent', () => {
  const baselineLines = ['The current monorepo has 198 packages.'];
  const currentLines = ['The current monorepo has &#49;&#57;&#56; packages.'];
  const allowlist: AllowEntry[] = [{ path: 'docs/entities.html', literal: '198' }];
  const baselineIdentities = claimIdentitiesForLines(
    'docs/entities.html',
    baselineLines,
    metrics(12),
  );

  assert.deepEqual(
    claimFailuresForLines(
      'docs/entities.html',
      currentLines,
      metrics(12),
      allowlist,
      baselineIdentities,
    ),
    ['docs/entities.html:1: hardcoded 198; canonical value for this context is 199'],
  );
});

test('keeps entity-produced angle brackets as text rather than structural syntax', () => {
  const source =
    '<div><span>Current platform evidence &#60;/span&#62; &#60;span&#62; Guardian ships 35 tests</span></div>';

  assert.deepEqual(claimFailuresForLines('docs/entities.html', [source], metrics(12), []), [
    'docs/entities.html:1: hardcoded 35; canonical value for this context is 100',
  ]);
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

test('classifies reverse shared-noun compound test counts', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/testing.md',
      ['The current platform reports 99 passing and 105 total tests.'],
      metrics(12),
      [],
    ),
    ['docs/testing.md:1: hardcoded 99; canonical value for this context is 100'],
  );
});

test('classifies common compound test punctuation and shared-noun forms', () => {
  for (const claimText of [
    'The current platform has 105 tests: 100 passed.',
    'The current platform has 105 tests (100 passed).',
    'The current platform has 105 total tests, of which 100 passed.',
    'The current platform reports 100 passing, 105 total tests.',
    'The current platform has 100 tests passed out of 105 total.',
  ]) {
    assert.deepEqual(
      claimFailuresForLines('docs/testing.md', [claimText], metrics(12), []),
      [],
      claimText,
    );
  }

  const staleClaims = new Map([
    [
      'The current platform has 105 tests: 99 passed.',
      'docs/testing.md:1: hardcoded 99; canonical value for this context is 100',
    ],
    [
      'The current platform has 104 tests (100 passed).',
      'docs/testing.md:1: hardcoded 104; canonical value for this context is 105',
    ],
    [
      'The current platform has 105 total tests, of which 99 passed.',
      'docs/testing.md:1: hardcoded 99; canonical value for this context is 100',
    ],
    [
      'The current platform reports 99 passing, 105 total tests.',
      'docs/testing.md:1: hardcoded 99; canonical value for this context is 100',
    ],
    [
      'The current platform has 100 tests passed out of 104 total.',
      'docs/testing.md:1: hardcoded 104; canonical value for this context is 105',
    ],
  ]);
  for (const [claimText, expected] of staleClaims) {
    assert.deepEqual(
      claimFailuresForLines('docs/testing.md', [claimText], metrics(12), []),
      [expected],
      claimText,
    );
  }
});

test('classifies slash, em-dash, and pass-fail-total test roles independently', () => {
  for (const claimText of [
    'The current platform has 100 / 105 platform tests passed.',
    'The current platform reports 105 total tests — 100 passed — 5 failed.',
    'The current platform reports 100 passed — 5 failed — 105 total tests.',
  ]) {
    assert.deepEqual(
      claimFailuresForLines('docs/testing.md', [claimText], metrics(12), []),
      [],
      claimText,
    );
  }

  const staleClaims = new Map([
    [
      'The current platform has 100 / 104 platform tests passed.',
      'docs/testing.md:1: hardcoded 104; canonical value for this context is 105',
    ],
    [
      'The current platform reports 105 total tests — 99 passed — 6 failed.',
      'docs/testing.md:1: hardcoded 99; canonical value for this context is 100',
    ],
    [
      'The current platform reports 100 passed — 5 failed — 104 total tests.',
      'docs/testing.md:1: hardcoded 104; canonical value for this context is 105',
    ],
  ]);
  for (const [claimText, expected] of staleClaims) {
    assert.deepEqual(
      claimFailuresForLines('docs/testing.md', [claimText], metrics(12), []),
      [expected],
      claimText,
    );
  }
});

test('classifies pass/fail and success/error role nouns and adjectives', () => {
  for (const claimText of [
    'The current platform reports 100 pass, 5 fail, 105 total tests.',
    'The current platform reports 100 successful, 5 errors, 105 total tests.',
  ]) {
    assert.deepEqual(claimFailuresForLines('docs/testing.md', [claimText], metrics(12), []), []);
  }

  for (const claimText of [
    'The current platform reports 99 pass, 6 fail, 105 total tests.',
    'The current platform reports 99 successful, 6 errors, 105 total tests.',
  ]) {
    assert.deepEqual(claimFailuresForLines('docs/testing.md', [claimText], metrics(12), []), [
      'docs/testing.md:1: hardcoded 99; canonical value for this context is 100',
    ]);
  }
});

test('classifies plural passes and fails test roles', () => {
  assert.deepEqual(
    claimFailuresForLines(
      'docs/testing.md',
      ['The current platform reports 99 passes, 6 fails, 105 total tests.'],
      metrics(12),
      [],
    ),
    ['docs/testing.md:1: hardcoded 99; canonical value for this context is 100'],
  );
  assert.deepEqual(
    claimFailuresForLines(
      'docs/testing.md',
      ['The current platform reports 100 passes, 5 fails, 105 total tests.'],
      metrics(12),
      [],
    ),
    [],
  );
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

test('scans the singular test watchword', () => {
  assert.deepEqual(
    claimFailuresForLines('docs/testing.md', ['The current platform has 1 test.'], metrics(12), []),
    ['docs/testing.md:1: hardcoded 1; canonical value for this context is 100'],
  );
});

test('does not join same-line HTML or JSX siblings into one claim context', () => {
  for (const relative of ['docs/siblings.html', 'src/Siblings.tsx']) {
    assert.deepEqual(
      claimFailuresForLines(
        relative,
        ['<div><span>Current release notes</span><span>Guardian ships 35 tests</span></div>'],
        metrics(12),
        [],
      ),
      [],
    );
  }
});

test('keeps unrelated numeric HTML, block, and custom-component siblings separate', () => {
  for (const source of [
    '<div><span>Current release notes</span><span>35 tests from the Guardian archive</span></div>',
    '<div><span>Current release notes</span>{/* separate */}<span>35 tests from the Guardian archive</span></div>',
    '<main><section>Current release notes</section><section>35 tests from the Guardian archive</section></main>',
    '<Stack><Text>Current release notes</Text><Panel>35 tests from the Guardian archive</Panel></Stack>',
  ]) {
    assert.deepEqual(claimFailuresForLines('src/Siblings.tsx', [source], metrics(12), []), []);
  }
});

test('does not join same-line siblings across HTML or JSX comments and fragments', () => {
  const cases: Array<[string, string]> = [
    [
      'docs/siblings.html',
      '<div><span>Current release notes</span><!-- separate --><span>Guardian ships 35 tests</span></div>',
    ],
    [
      'src/Siblings.tsx',
      '<><span>Current release notes</span>{/* separate */}<span>Guardian ships 35 tests</span></>',
    ],
    [
      'src/Siblings.tsx',
      '<div><>Current release notes</>{/* separate */}<>Guardian ships 35 tests</></div>',
    ],
    [
      'src/Siblings.tsx',
      '<div><span>Current release notes</span>{show && <span>Guardian ships 35 tests</span>}</div>',
    ],
    [
      'docs/siblings.html',
      '<div><span>Current release notes</span> separate sibling <span>Guardian ships 35 tests</span></div>',
    ],
  ];
  for (const [relative, source] of cases) {
    assert.deepEqual(claimFailuresForLines(relative, [source], metrics(12), []), []);
  }
});

test('tokenizes adversarial HTML and JSX comment runs without backtracking', {
  timeout: 2_000,
}, () => {
  for (const [relative, comments] of [
    ['docs/comments.html', '<!-- split -->'.repeat(20_000)],
    ['src/Comments.tsx', '{/* split */}'.repeat(20_000)],
  ]) {
    const source = `<div><span>Current release notes</span>${comments}<span>Guardian ships 35 tests</span></div>`;
    assert.deepEqual(claimFailuresForLines(relative, [source], metrics(12), []), []);
  }
});

test('preserves claim overlap across bounded block splits', () => {
  const lines = [
    ...Array.from({ length: 31 }, () => 'Filler continuation'),
    'The current monorepo contains',
    '198 packages.',
  ];

  assert.deepEqual(claimFailuresForLines('docs/wrapped.md', lines, metrics(12), []), [
    'docs/wrapped.md:33: hardcoded 198; canonical value for this context is 199',
  ]);
});

test('preserves a character-bounded suffix across more than four wrapped lines', () => {
  const lines = [
    ...Array.from({ length: 26 }, () => 'Filler continuation'),
    'The current monorepo contains',
    ...Array.from({ length: 5 }, () => 'brief continuation'),
    '198 packages.',
  ];

  assert.deepEqual(claimFailuresForLines('docs/wrapped.md', lines, metrics(12), []), [
    'docs/wrapped.md:33: hardcoded 198; canonical value for this context is 199',
  ]);
});

test('preserves the tail of a long line across a bounded block split', () => {
  const lines = [`${'x'.repeat(20_000)} The current monorepo contains`, '198 packages.'];

  assert.deepEqual(claimFailuresForLines('docs/wrapped.md', lines, metrics(12), []), [
    'docs/wrapped.md:2: hardcoded 198; canonical value for this context is 199',
  ]);
});

test('preserves prior context when the next wrapped line exceeds the block limit', () => {
  const lines = ['The current monorepo has 198', `packages ${'x'.repeat(20_000)}`];

  assert.deepEqual(claimFailuresForLines('docs/wrapped.md', lines, metrics(12), []), [
    'docs/wrapped.md:1: hardcoded 198; canonical value for this context is 199',
  ]);
});

test('budgets wrapped overlap by decoded semantic characters and preserves entity boundaries', () => {
  const lines = [
    ...Array.from({ length: 30 }, () => 'Filler continuation'),
    'The current monorepo contains',
    '&#97;'.repeat(100),
    '198 packages.',
  ];

  assert.deepEqual(claimFailuresForLines('docs/wrapped.md', lines, metrics(12), []), [
    'docs/wrapped.md:33: hardcoded 198; canonical value for this context is 199',
  ]);
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

test('keeps a huge minified HTML line bounded while scanning its tail', { timeout: 2_000 }, () => {
  const line = `<div>${'x'.repeat(500_000)} The current monorepo has 198 packages.</div>`;
  const started = performance.now();

  assert.deepEqual(claimFailuresForLines('docs/minified.html', [line], metrics(12), []), [
    'docs/minified.html:1: hardcoded 198; canonical value for this context is 199',
  ]);
  assert.ok(performance.now() - started < 1_500);
});

test('decodes an encoded claim across a bounded chunk overlap', { timeout: 2_000 }, () => {
  const line = `<div>${'x'.repeat(
    16_360,
  )} The current monorepo has &#49;&#57;&#56; packages.</div>`;

  assert.deepEqual(claimFailuresForLines('docs/minified.html', [line], metrics(12), []), [
    'docs/minified.html:1: hardcoded 198; canonical value for this context is 199',
  ]);
});

test('uses a compact source map for multi-megabyte plain input', { timeout: 2_000 }, () => {
  assert.equal(semanticSourceSpanCount('x'.repeat(4 * 1024 * 1024)), 1);
});

test('uses a strided source map for multi-megabyte entity-dense input', { timeout: 5_000 }, () => {
  const entity = '&#49;';
  const source = entity.repeat(Math.ceil((4 * 1024 * 1024) / entity.length));
  assert.equal(semanticSourceSpanCount(source), 1);
});

test('bounds mixed-width entity maps and still scans a stale tail claim', {
  timeout: 5_000,
}, () => {
  const pattern = '&#32;&#x20;&#32&#x20';
  const source = pattern.repeat(Math.ceil((4 * 1024 * 1024) / pattern.length));
  const started = performance.now();
  assert.ok(semanticSourceSpanCount(source) <= 1_024);
  assert.deepEqual(
    claimFailuresForLines(
      'docs/mixed-entities.html',
      [`<p>${source}The current monorepo has 198 packages.</p>`],
      metrics(12),
      [],
    ),
    ['docs/mixed-entities.html:1: hardcoded 198; canonical value for this context is 199'],
  );
  assert.ok(semanticDecodeWindowMaxSourceLength(source) <= 131_072);
  assert.ok(performance.now() - started < 4_000);
});
