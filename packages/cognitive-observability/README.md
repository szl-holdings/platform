# @workspace/cognitive-observability

Cognitive Observability is the **telemetry, quality, cost, drift, and value metrics layer** for the SZL Agentic Cognitive Operating Intelligence Platform.

## Contract

Cognitive Observability exports every metric listed in the platform spec with an OpenTelemetry-compatible exporter. Continuum, Tool Mesh, and Trace Graph wire into this layer to emit the full metric set.

### Metric Definitions

| Metric | Type | Unit | Description |
|--------|------|------|-------------|
| `latency_ms` | histogram | ms | End-to-end agent request latency |
| `token_count` | counter | tokens | Total tokens consumed |
| `tool_error_rate` | gauge | ratio | Rate of tool invocation errors |
| `retrieval_quality_score` | gauge | score | Average retrieval quality (0–1) |
| `memory_hit_rate` | gauge | ratio | Memory cache hit rate |
| `hallucination_rate` | gauge | ratio | Estimated hallucination rate |
| `citation_coverage` | gauge | ratio | Fraction of claims with citations |
| `approval_bottleneck_ms` | histogram | ms | Time waiting for human approvals |
| `override_rate` | gauge | ratio | Rate of human policy overrides |
| `rollback_count` | counter | events | Number of workflow rollbacks |
| `drift_score` | gauge | score | Model/behavior drift from baseline |
| `value_created_usd` | counter | USD | Business value created by agents |
| `value_at_risk_usd` | gauge | USD | Business value at risk |
| `agent_reliability_score` | gauge | score | Composite reliability score (0–1) |
| `cost_usd` | counter | USD | Total agent runtime cost |

### Recording Metrics

```typescript
import { InMemoryMetricCollector } from '@workspace/cognitive-observability/collector';
import { ConsoleOtelExporter } from '@workspace/cognitive-observability/exporter';

const collector = new InMemoryMetricCollector();

collector.recordKnown('latency_ms', 142, { agent: 'planner', model: 'gpt-4o' });
collector.recordKnown('token_count', 1500, { agent: 'planner' });
collector.recordKnown('value_created_usd', 2500);

const exporter = new ConsoleOtelExporter({ resource: { 'service.name': 'my-app' } });
await exporter.export(collector.flush());
```

### Batching Exporter

```typescript
import { BatchingExporter, HttpOtelExporter } from '@workspace/cognitive-observability/exporter';

const httpExporter = new HttpOtelExporter({
  endpoint: 'https://otel-collector.example.com/v1/metrics',
  resource: { 'service.name': 'szl-platform' },
});

const batcher = new BatchingExporter(httpExporter, collector, 60000);
batcher.start();
```

## Non-goals

- Cognitive Observability does not send to a production OTel backend out of the box.
- Cognitive Observability does not replace existing app-level Sentry/analytics wiring.
- Per-app metric emission is opt-in in follow-up tasks.

## Absorption

This package absorbs and re-exports `@szl-holdings/observability-core` as a compatibility shim.
