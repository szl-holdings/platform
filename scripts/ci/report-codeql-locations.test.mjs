import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { annotation, locationDiagnostics } from './report-codeql-locations.mjs';

const tracked = new Set([
  'packages/substrate/src/journal.ts',
  'packages/substrate/src/python-worker.ts',
]);
const location = (uri, startLine = 10) => ({
  physicalLocation: {
    artifactLocation: { uri },
    region: { startLine },
    snippet: { text: 'secret-source-snippet' },
  },
});
const report = (overrides = {}) => ({
  runs: [
    {
      tool: {
        driver: { rules: [{ id: 'js/password-hash', properties: { 'security-severity': '7.5' } }] },
      },
      results: [
        {
          ruleId: 'js/password-hash',
          message: { text: 'secret-message\n::error::injected' },
          locations: [location('packages/substrate/src/journal.ts')],
          codeFlows: [
            {
              threadFlows: [
                {
                  locations: [
                    { location: location('packages/substrate/src/python-worker.ts', 265) },
                  ],
                },
              ],
            },
          ],
          ...overrides,
        },
      ],
    },
  ],
});

test('emits only rule identifiers and tracked source/flow paths and lines', () => {
  const diagnostics = locationDiagnostics(report(), tracked);
  assert.deepEqual(diagnostics, [
    {
      ruleId: 'js/password-hash',
      locations: ['packages/substrate/src/journal.ts:10'],
      flows: [['packages/substrate/src/python-worker.ts:265']],
    },
  ]);
  const output = annotation(diagnostics[0]);
  assert.match(output, /^::notice title=CodeQL location trace::/);
  assert.doesNotMatch(output, /secret|injected|snippet|message/);
});

test('rejects external, untracked, traversal, percent encoded and command injection locations', () => {
  const unsafe = [
    'https://host/secret',
    '/etc/secret',
    '../secret',
    'packages/../secret',
    'untracked-secret',
    'packages/%2e%2e/secret',
    'secret\n::error::oops',
  ];
  const diagnostics = locationDiagnostics(
    report({ locations: unsafe.map((uri) => location(uri)), codeFlows: [] }),
    tracked,
  );
  assert.deepEqual(diagnostics[0].locations, []);
  assert.doesNotMatch(annotation(diagnostics[0]), /secret|oops/);
});

test('ignores invalid line coordinates and medium findings', () => {
  const sarif = report({
    locations: [
      location('packages/substrate/src/journal.ts', -1),
      location('packages/substrate/src/journal.ts', '10'),
    ],
    codeFlows: [],
  });
  assert.deepEqual(locationDiagnostics(sarif, tracked)[0].locations, []);
  sarif.runs[0].tool.driver.rules[0].properties['security-severity'] = '6.9';
  assert.deepEqual(locationDiagnostics(sarif, tracked), []);
});

test('malformed report and rule command injection fail rather than waive analysis', () => {
  for (const malformed of [
    null,
    {},
    { runs: [{}] },
    report({ ruleId: 'js/password-hash\n::error::secret' }),
  ]) {
    if (malformed?.runs?.[0]?.tool)
      malformed.runs[0].tool.driver.rules[0].id = malformed.runs[0].results[0].ruleId;
    assert.throws(() => locationDiagnostics(malformed, tracked));
  }
});

test('CLI malformed input returns failure without disclosing parse errors or payload', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'codeql-safe-diagnostics-'));
  try {
    writeFileSync(path.join(directory, 'javascript.sarif'), 'secret-malformed-token');
    const result = spawnSync(
      process.execPath,
      ['scripts/ci/report-codeql-locations.mjs', directory],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Analysis and severity gate remain required/);
    assert.doesNotMatch(result.stdout + result.stderr, /secret-malformed-token|SyntaxError/);
    rmSync(path.join(directory, 'javascript.sarif'));
    const empty = spawnSync(
      process.execPath,
      ['scripts/ci/report-codeql-locations.mjs', directory],
      { encoding: 'utf8' },
    );
    assert.equal(empty.status, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('analyzer preserves uploads and fails if location diagnostics are unavailable', () => {
  const workflow = readFileSync('.github/workflows/codeql.yml', 'utf8');
  const analyze = workflow.split('  analyze:')[1].split('  severity-gate-contract:')[0];
  assert.match(analyze, /output: \$\{\{ runner\.temp \}\}\/codeql-sarif/);
  assert.match(analyze, /upload: always/);
  assert.match(analyze, /wait-for-processing: true/);
  assert.match(analyze, /Report safe CodeQL source and flow locations\n        if: always\(\)/);
  assert.doesNotMatch(analyze, /continue-on-error|\|\| true/);
});

test('resolves CodeQL extension rules through rule.toolComponent/index and emits numeric coverage', () => {
  const sarif = report();
  const run = sarif.runs[0];
  run.tool.extensions = [
    {
      name: 'codeql/javascript-queries',
      guid: 'test-component-guid',
      rules: run.tool.driver.rules,
    },
  ];
  run.tool.driver.rules = [];
  run.results[0].rule = {
    id: 'js/password-hash',
    index: 0,
    toolComponent: { index: 0, name: 'codeql/javascript-queries' },
  };
  const coverage = {};
  assert.equal(locationDiagnostics(sarif, tracked, coverage)[0].ruleId, 'js/password-hash');
  assert.deepEqual(coverage, {
    runs: 1,
    results: 1,
    resolvedRules: 1,
    securityResults: 1,
    highCriticalResults: 1,
    sourceLocations: 1,
    flowLocations: 1,
  });
  delete run.results[0].rule.toolComponent.index;
  assert.equal(locationDiagnostics(sarif, tracked).length, 1);
  delete run.results[0].rule;
  assert.equal(locationDiagnostics(sarif, tracked).length, 1);
});

test('resolves driver index-only rules and rejects unresolved/ambiguous metadata', () => {
  const indexed = report();
  delete indexed.runs[0].results[0].ruleId;
  indexed.runs[0].results[0].ruleIndex = 0;
  assert.equal(locationDiagnostics(indexed, tracked).length, 1);
  delete indexed.runs[0].results[0].ruleIndex;
  indexed.runs[0].results[0].rule = { index: 0 };
  assert.equal(locationDiagnostics(indexed, tracked).length, 1);
  const unknown = report({ ruleId: 'js/unknown' });
  assert.throws(() => locationDiagnostics(unknown, tracked));
  const duplicated = report();
  duplicated.runs[0].tool.extensions = [{ rules: duplicated.runs[0].tool.driver.rules }];
  assert.throws(() => locationDiagnostics(duplicated, tracked));
  const badIndex = report({ rule: { index: 0, toolComponent: { index: 9 } } });
  assert.throws(() => locationDiagnostics(badIndex, tracked));
  const inconsistent = report({ ruleIndex: 1 });
  assert.throws(() => locationDiagnostics(inconsistent, tracked));
});

test('security rules with absent or malformed severity cannot silently disappear', () => {
  for (const severity of [undefined, null, '', 'invalid', 11]) {
    const sarif = report();
    sarif.runs[0].tool.driver.rules[0].properties = {
      tags: ['security'],
      'security-severity': severity,
    };
    assert.throws(() => locationDiagnostics(sarif, tracked));
  }
  const quality = report();
  quality.runs[0].tool.driver.rules[0].properties = { tags: ['maintainability'] };
  const coverage = {};
  assert.deepEqual(locationDiagnostics(quality, tracked, coverage), []);
  assert.equal(coverage.resolvedRules, 1);
  assert.equal(coverage.securityResults, 0);
});

test('long annotations remain parseable JSON and retain primary location and flow source/sink', () => {
  const source = 'packages/substrate/src/python-worker.ts:265';
  const sink = 'packages/substrate/src/journal.ts:159';
  const diagnostic = {
    ruleId: 'js/password-hash',
    locations: [
      sink,
      ...Array.from({ length: 100 }, (_, i) => `packages/substrate/src/journal.ts:${i + 1}`),
    ],
    flows: [
      [
        source,
        source,
        ...Array.from(
          { length: 500 },
          (_, i) => `packages/substrate/src/python-worker.ts:${i + 1}`,
        ),
        sink,
      ],
      ...Array.from({ length: 30 }, () => [source, sink]),
    ],
    message: 'secret-message',
    snippet: 'secret-snippet',
  };
  const output = annotation(diagnostic);
  assert.ok(output.length < 3500);
  const decoded = JSON.parse(output.split('::notice title=CodeQL location trace::')[1]);
  assert.equal(decoded.locations[0], sink);
  assert.equal(decoded.flows[0][0], source);
  assert.equal(decoded.flows[0].at(-1), sink);
  assert.ok(decoded.omitted.flowLocations > 0);
  assert.equal(decoded.consecutiveDuplicates, 1);
  assert.doesNotMatch(output, /secret-message|secret-snippet/);
  assert.equal(
    decoded.flows.reduce((sum, flow) => sum + flow.length, 0) +
      decoded.omitted.flowLocations +
      decoded.consecutiveDuplicates,
    diagnostic.flows.reduce((sum, flow) => sum + flow.length, 0),
  );
  assert.equal(
    decoded.locations.length + decoded.omitted.sourceLocations,
    diagnostic.locations.length,
  );
  assert.equal(decoded.flows.length + decoded.omitted.flows, diagnostic.flows.length);
});

test('consecutive duplicate flow locations collapse without discarding distinct locations', () => {
  const output = annotation({
    ruleId: 'js/password-hash',
    locations: ['a.ts:1'],
    flows: [['a.ts:1', 'a.ts:1', 'b.ts:2', 'b.ts:2', 'a.ts:1']],
  });
  const decoded = JSON.parse(output.split('::notice title=CodeQL location trace::')[1]);
  assert.deepEqual(decoded.flows, [['a.ts:1', 'b.ts:2', 'a.ts:1']]);
  assert.equal(decoded.consecutiveDuplicates, 2);
});
