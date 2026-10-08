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
  assert.match(output, /^::warning title=CodeQL location trace::/);
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
