import type { EvalRunResult } from '../types.js';

export function printEvalResult(result: EvalRunResult): void {
  const line = (s: string) => process.stdout.write(s + '\n');
  const sep = '─'.repeat(60);

  line(sep);
  line(`AEF Eval Run — Profile: ${result.profileId}`);
  line(`Dataset:    ${result.datasetId}`);
  line(`Queries:    ${result.queryCount}`);
  line(`Completed:  ${result.completedAt}`);
  line(sep);

  line('Retrieval Metrics:');
  for (const m of result.metrics) {
    const pct = (m.value * 100).toFixed(1);
    line(`  ${m.metric.toUpperCase()}@${m.atK}: ${pct}% (${m.value.toFixed(4)})`);
  }

  line('');
  line('Latency:');
  line(`  p50:  ${result.latencyP50Ms.toFixed(1)} ms`);
  line(`  p95:  ${result.latencyP95Ms.toFixed(1)} ms`);
  line(`  p99:  ${result.latencyP99Ms.toFixed(1)} ms`);

  if (result.throughputQps !== undefined) {
    line(`  QPS:  ${result.throughputQps.toFixed(2)}`);
  }

  const total = result.evidenceCompleteness.length;
  const complete = result.evidenceCompleteness.filter((e) => e.complete).length;
  line('');
  line(`Evidence Completeness: ${complete}/${total} queries fully traced`);

  line(sep);
}
