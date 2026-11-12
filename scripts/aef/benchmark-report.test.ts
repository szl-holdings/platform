import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  renderApiBenchmarkReport,
  renderRetrievalBenchmarkReport,
} from './benchmark-report.ts';

test('renders the retrieval benchmark with a stable table contract', () => {
  const report = renderRetrievalBenchmarkReport({
    mode: 'fixture',
    iterations: 100,
    warmup: 10,
    rows: [
      {
        domain: 'vessels_maritime_risk',
        p50Ms: 1,
        p95Ms: 2.5,
        p99Ms: 3,
        avgMs: 1.75,
        throughputQps: 571.4,
        recall: 0.9,
        ndcg: 0.81234,
        mrr: 1,
      },
    ],
  });

  assert.equal(
    report,
    [
      'AEF retrieval benchmark',
      'mode: fixture',
      'iterations per domain: 100',
      'warmup per domain: 10',
      '',
      '| Domain | p50 ms | p95 ms | p99 ms | avg ms | QPS | recall@k | nDCG@k | MRR |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      '| vessels_maritime_risk | 1.00 | 2.50 | 3.00 | 1.75 | 571 | 0.900 | 0.812 | 1.000 |',
      '',
    ].join('\n'),
  );
});

test('renders failed API suites without throwing or fabricating latency', () => {
  const report = renderApiBenchmarkReport({
    roundsPerSuite: 20,
    rows: [
      {
        suite: 'hybrid-search',
        succeeded: 0,
        failed: 20,
        invalid: 0,
        latency: null,
        throughputPerSecond: null,
      },
    ],
  });

  assert.equal(
    report,
    [
      'AEF API benchmark',
      'rounds per suite: 20',
      '',
      '| Suite | Succeeded | Failed | Invalid | min ms | p50 ms | p95 ms | p99 ms | max ms | avg ms | throughput/s |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      '| hybrid-search | 0 | 20 | 0 | n/a | n/a | n/a | n/a | n/a | n/a | n/a |',
      '',
    ].join('\n'),
  );
});

test('report inputs exclude runtime configuration and entry points use the renderer boundary', () => {
  const runtimeConfiguration = {
    apiKey: 'secret-api-key',
    endpoint: 'https://private.example.test',
    tenant: 'private-tenant',
  };
  const reportInput = {
    roundsPerSuite: 1,
    rows: [],
    ...runtimeConfiguration,
  };
  const report = renderApiBenchmarkReport(reportInput);

  for (const secret of Object.values(runtimeConfiguration)) {
    assert.equal(report.includes(secret), false);
  }

  const retrievalEntryPoint = readFileSync(new URL('../aef-bench.ts', import.meta.url), 'utf8');
  const apiEntryPoint = readFileSync(new URL('./benchmark.ts', import.meta.url), 'utf8');
  assert.match(
    retrievalEntryPoint,
    /process\.stdout\.write\(\s*renderRetrievalBenchmarkReport\(/,
  );
  assert.match(apiEntryPoint, /process\.stdout\.write\(renderApiBenchmarkReport\(/);
  assert.doesNotMatch(`${retrievalEntryPoint}\n${apiEntryPoint}`, /console\.(?:log|error)/);
  assert.doesNotMatch(retrievalEntryPoint, /response\.text\(/);
});
