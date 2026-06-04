import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryMetricCollector } from './collector.js';
import { ConsoleOtelExporter, toOtelPayload } from './exporter.js';
import { CognitiveMetricSchema, METRIC_DEFINITIONS, makeMetric } from './metrics.js';

describe('METRIC_DEFINITIONS', () => {
  it('contains all 15 required metrics', () => {
    const required = [
      'latency_ms',
      'token_count',
      'tool_error_rate',
      'retrieval_quality_score',
      'memory_hit_rate',
      'hallucination_rate',
      'citation_coverage',
      'approval_bottleneck_ms',
      'override_rate',
      'rollback_count',
      'drift_score',
      'value_created_usd',
      'value_at_risk_usd',
      'agent_reliability_score',
      'cost_usd',
    ];
    for (const name of required) {
      expect(METRIC_DEFINITIONS).toHaveProperty(name);
    }
  });
});

describe('makeMetric', () => {
  it('creates a valid CognitiveMetric', () => {
    const m = makeMetric('latency_ms', 120, { agent: 'planner' });
    expect(m.name).toBe('latency_ms');
    expect(m.value).toBe(120);
    expect(m.labels.agent).toBe('planner');
    CognitiveMetricSchema.parse(m);
  });
});

describe('InMemoryMetricCollector', () => {
  let collector: InMemoryMetricCollector;

  beforeEach(() => {
    collector = new InMemoryMetricCollector();
  });

  it('records and snapshots metrics', () => {
    collector.recordKnown('token_count', 500);
    collector.recordKnown('cost_usd', 0.02);
    expect(collector.snapshot()).toHaveLength(2);
  });

  it('flush empties the buffer', () => {
    collector.recordKnown('latency_ms', 80);
    const flushed = collector.flush();
    expect(flushed).toHaveLength(1);
    expect(collector.snapshot()).toHaveLength(0);
  });

  it('records metrics with labels', () => {
    collector.recordKnown('tool_error_rate', 0.02, { tool: 'search' });
    const snap = collector.snapshot();
    expect(snap[0]?.labels.tool).toBe('search');
  });
});

describe('ConsoleOtelExporter', () => {
  it('exports without throwing', async () => {
    const exporter = new ConsoleOtelExporter({ resource: { 'service.name': 'test' } });
    const metrics = [makeMetric('latency_ms', 100)];
    await expect(exporter.export(metrics)).resolves.not.toThrow();
  });
});

describe('toOtelPayload', () => {
  it('groups metrics by name', () => {
    const metrics = [
      makeMetric('latency_ms', 100, { agent: 'a' }),
      makeMetric('latency_ms', 200, { agent: 'b' }),
      makeMetric('token_count', 500),
    ];
    const payload = toOtelPayload(metrics, { 'service.name': 'test' }) as {
      metrics: Array<{ name: string; dataPoints: unknown[] }>;
    };
    expect(payload.metrics).toHaveLength(2);
    const latencyEntry = payload.metrics.find((m) => m.name === 'latency_ms');
    expect(latencyEntry?.dataPoints).toHaveLength(2);
  });
});
