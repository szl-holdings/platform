import type { TraceRecord, TraceSpan } from "./schema.js";
import type { TraceStore } from "./store.js";
import { defaultTraceStore } from "./store.js";

export interface TraceTree {
  trace: TraceRecord;
  spans: SpanTree[];
}

export interface SpanTree {
  span: TraceSpan;
  children: SpanTree[];
}

function buildSpanTree(spans: TraceSpan[]): SpanTree[] {
  const byId = new Map<string, SpanTree>(spans.map((s) => [s.spanId, { span: s, children: [] }]));
  const roots: SpanTree[] = [];

  for (const node of byId.values()) {
    const parentId = node.span.parentSpanId;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export class TraceReplayer {
  private readonly store: TraceStore;

  constructor(store: TraceStore = defaultTraceStore) {
    this.store = store;
  }

  getTraceTree(traceId: string): TraceTree | undefined {
    const trace = this.store.get(traceId);
    if (!trace) return undefined;
    return {
      trace,
      spans: buildSpanTree(trace.spans),
    };
  }

  replayTrace(traceId: string, visitor: TraceReplayVisitor): void {
    const tree = this.getTraceTree(traceId);
    if (!tree) throw new Error(`Trace not found: ${traceId}`);

    visitor.onTraceStart?.(tree.trace);

    for (const toolCall of tree.trace.toolCalls) {
      visitor.onToolCall?.(toolCall, tree.trace);
    }

    for (const retrieval of tree.trace.retrieval) {
      visitor.onRetrieval?.(retrieval, tree.trace);
    }

    for (const memIo of tree.trace.memoryIO) {
      visitor.onMemoryIO?.(memIo, tree.trace);
    }

    for (const guardrail of tree.trace.guardrailResults) {
      visitor.onGuardrailResult?.(guardrail, tree.trace);
    }

    function visitSpan(node: SpanTree): void {
      visitor.onSpan?.(node.span, tree!.trace);
      for (const child of node.children) visitSpan(child);
    }
    for (const root of tree.spans) visitSpan(root);

    visitor.onTraceEnd?.(tree.trace);
  }

  compareTraces(traceIdA: string, traceIdB: string): TraceDiff {
    const a = this.store.get(traceIdA);
    const b = this.store.get(traceIdB);
    if (!a) throw new Error(`Trace not found: ${traceIdA}`);
    if (!b) throw new Error(`Trace not found: ${traceIdB}`);

    return {
      latencyDeltaMs: (b.latencyMs ?? 0) - (a.latencyMs ?? 0),
      tokenDelta: (b.totalTokens ?? 0) - (a.totalTokens ?? 0),
      costDeltaUsd: (b.costUsd ?? 0) - (a.costUsd ?? 0),
      toolCallCountDelta: b.toolCalls.length - a.toolCalls.length,
      errorCountDelta: b.errors.length - a.errors.length,
      retrialDelta: b.retries - a.retries,
      statusA: a.status,
      statusB: b.status,
    };
  }
}

export interface TraceReplayVisitor {
  onTraceStart?: (trace: TraceRecord) => void;
  onTraceEnd?: (trace: TraceRecord) => void;
  onToolCall?: (call: TraceRecord["toolCalls"][0], trace: TraceRecord) => void;
  onRetrieval?: (retrieval: TraceRecord["retrieval"][0], trace: TraceRecord) => void;
  onMemoryIO?: (io: TraceRecord["memoryIO"][0], trace: TraceRecord) => void;
  onGuardrailResult?: (result: TraceRecord["guardrailResults"][0], trace: TraceRecord) => void;
  onSpan?: (span: TraceSpan, trace: TraceRecord) => void;
}

export interface TraceDiff {
  latencyDeltaMs: number;
  tokenDelta: number;
  costDeltaUsd: number;
  toolCallCountDelta: number;
  errorCountDelta: number;
  retrialDelta: number;
  statusA: TraceRecord["status"];
  statusB: TraceRecord["status"];
}

export const defaultReplayer = new TraceReplayer(defaultTraceStore);
