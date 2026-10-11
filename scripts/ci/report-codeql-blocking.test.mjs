import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  blockingContexts,
  blockingTraces,
  matchingAnalyses,
  reportBlocking,
} from './report-codeql-blocking.mjs';

const ref = 'refs/pull/899/merge';
const tracked = new Set([
  'packages/substrate/src/journal.ts',
  'packages/substrate/src/python-worker.ts',
]);
const commit = 'a'.repeat(40);
const alert = () => ({
  number: 1,
  tool: { name: 'CodeQL' },
  rule: { id: 'js/password-hash', security_severity_level: 'high' },
  most_recent_instance: {
    ref,
    commit_sha: commit,
    analysis_key: '.github/workflows/codeql.yml:analyze',
    category: '/language:javascript-typescript',
    location: { path: 'packages/substrate/src/journal.ts', start_line: 159 },
    message: { text: 'secret-alert-message' },
  },
});
const analysis = () => ({
  id: 7,
  tool: { name: 'CodeQL' },
  ref,
  commit_sha: commit,
  analysis_key: '.github/workflows/codeql.yml:analyze',
  category: '/language:javascript-typescript',
});
const location = (uri, startLine) => ({
  physicalLocation: {
    artifactLocation: { uri },
    region: { startLine },
    snippet: { text: 'secret-snippet' },
  },
});
const sarif = () => ({
  runs: [
    {
      tool: {
        driver: { rules: [] },
        extensions: [{ name: 'queries', rules: [{ id: 'js/password-hash' }] }],
      },
      results: [
        {
          ruleId: 'js/password-hash',
          rule: { index: 0, toolComponent: { index: 0 } },
          locations: [location('packages/substrate/src/journal.ts', 159)],
          message: { text: 'secret-message' },
          codeFlows: [
            {
              threadFlows: [
                {
                  locations: [
                    { location: location('packages/substrate/src/python-worker.ts', 265) },
                    { location: location('packages/substrate/src/journal.ts', 159) },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

test('blocking context contains provenance without arbitrary alert text', () => {
  const context = blockingContexts([[alert()]], tracked, ref)[0];
  assert.equal(context.commit, commit);
  assert.equal(context.location, 'packages/substrate/src/journal.ts:159');
  assert.doesNotMatch(JSON.stringify(context), /secret-alert-message/);
  const injected = alert();
  injected.most_recent_instance.analysis_key = 'secret\n::error::injected';
  assert.throws(() => blockingContexts([[injected]], tracked, ref));
  const missing = alert();
  delete missing.most_recent_instance.commit_sha;
  assert.throws(() => blockingContexts([[missing]], tracked, ref));
});

test('matching analyses require exact ref, commit, analysis key and category', () => {
  const contexts = blockingContexts([[alert()]], tracked, ref);
  const entries = [
    analysis(),
    { ...analysis(), commit_sha: 'b'.repeat(40) },
    { ...analysis(), category: '/language:python' },
    { ...analysis(), ref: 'refs/heads/main' },
    { ...analysis(), analysis_key: 'other' },
    { ...analysis(), tool: { name: 'other' } },
  ];
  assert.equal(matchingAnalyses([entries], contexts, ref).length, 1);
});

test('target tracing uses the exact blocking rule and location regardless of missing severity', () => {
  const contexts = blockingContexts([[alert()]], tracked, ref);
  const traces = blockingTraces(sarif(), tracked, contexts);
  assert.equal(traces.length, 1);
  assert.deepEqual(traces[0].flows[0], [
    'packages/substrate/src/python-worker.ts:265',
    'packages/substrate/src/journal.ts:159',
  ]);
  assert.doesNotMatch(JSON.stringify(traces), /secret/);
  assert.deepEqual(
    blockingTraces(sarif(), tracked, [
      { ...contexts[0], location: 'packages/substrate/src/journal.ts:160' },
    ]),
    [],
  );
});

test('blocking diagnostics use at most nine bounded annotations and validated SARIF API', () => {
  const emitted = [];
  const payload = sarif();
  payload.runs[0].results = Array.from({ length: 20 }, () => payload.runs[0].results[0]);
  reportBlocking(
    [[alert()]],
    tracked,
    'szl-holdings/platform',
    ref,
    (endpoint, accept) => {
      if (endpoint.endsWith('/analyses')) return [[analysis()]];
      assert.equal(endpoint, 'repos/szl-holdings/platform/code-scanning/analyses/7');
      assert.equal(accept, 'application/sarif+json');
      return payload;
    },
    (message) => emitted.push(message),
  );
  assert.equal(emitted.length, 9);
  assert.ok(emitted.every((message) => message.length < 3500));
  assert.doesNotMatch(emitted.join('\n'), /secret/);
  for (const message of emitted) assert.doesNotThrow(() => JSON.parse(message.split('::').at(-1)));
});

test('absent matching analysis fails diagnostics without clearing any blocking alert', () => {
  assert.throws(() =>
    reportBlocking(
      [[alert()]],
      tracked,
      'szl-holdings/platform',
      ref,
      () => [[]],
      () => {},
    ),
  );
  const workflow = readFileSync('.github/workflows/codeql.yml', 'utf8');
  const gate = workflow.split('  severity-gate:\n')[1];
  assert.match(gate, /if ! node scripts\/ci\/report-codeql-blocking\.mjs/);
  assert.match(gate, /blocking verdict is unchanged/);
  assert.match(
    gate,
    /CodeQL found \$\{count\} open critical\/high alert\(s\); blocking merge \(KG011\)\."\n            exit 1/,
  );
});
