# @workspace/trace-graph

Trace Graph is the **run/agent/tool trace capture and replay system** for the SZL Agentic Cognitive Operating Intelligence Platform.

## Contract

Every agent run, tool call, memory operation, retrieval, and guardrail check is captured as a `TraceRecord`. Traces are organized as span trees and can be replayed deterministically.

### Full Trace Schema Fields

- Identity: `traceId`, `requestId`, `sessionId`, `workflowId`, `agentId`
- Model: `model`, `promptVersion`
- Tool calls: tool ID/name, latency, tokens, cost, success, retries, approval
- Retrieval: source, query, hits, misses, latency, quality score
- Memory I/O: tier, operation, key, hit/miss, latency
- Citations: sourceId, type, snippet, coverage score
- Guardrails: guardId, tier, outcome, reason
- Spans: spanId, parentSpanId, name, latency, status, attributes
- Tokens: total, prompt, completion
- Cost: USD
- Approvals: approvalId, approver, decision, timestamp
- Errors: code, message, timestamp
- Retries, rollbackId
- Business impact: valueCreatedUsd, valueAtRiskUsd

### Writer API

```typescript
import { TraceWriter } from '@workspace/trace-graph/writer';
import { InMemoryTraceStore } from '@workspace/trace-graph/store';

const store = new InMemoryTraceStore();
const writer = new TraceWriter(store);

const trace = writer.startTrace({ traceId: 't-001', model: 'gpt-4o', agentId: 'planner' });
writer.appendToolCall('t-001', { toolId: 'search', toolName: 'Search', success: true, retries: 0, approvalRequired: false });
writer.completeTrace('t-001', { status: 'completed', latencyMs: 250, totalTokens: 1500 });
```

### Replay API

```typescript
import { TraceReplayer } from '@workspace/trace-graph/replay';

const replayer = new TraceReplayer(store);
replayer.replayTrace('t-001', {
  onTraceStart: (t) => console.log('Starting replay:', t.traceId),
  onToolCall: (c) => console.log('Tool:', c.toolName),
  onTraceEnd: (t) => console.log('Replay done'),
});

const diff = replayer.compareTraces('t-a', 't-b');
```

## Non-goals

- Trace Graph does not currently persist to the database by default (wire a DB adapter per-app in follow-up tasks).
- No app is required to emit traces yet — this is opt-in in per-app 3.0 upgrades.

## Absorption

This package absorbs and re-exports `@szl-holdings/replay-core` as a compatibility shim.
