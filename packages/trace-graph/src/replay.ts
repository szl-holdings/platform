import type { RunGrade, TraceRecord, TraceSpan } from './schema.js';
import type { TraceStore } from './store.js';
import { defaultTraceStore } from './store.js';

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

export interface TraceDiff {
  latencyDeltaMs: number;
  tokenDelta: number;
  costDeltaUsd: number;
  toolCallCountDelta: number;
  errorCountDelta: number;
  retrialDelta: number;
  statusA: TraceRecord['status'];
  statusB: TraceRecord['status'];
  modelChanged: boolean;
  modelsAdded: string[];
  modelsRemoved: string[];
  promptVersionsChanged: boolean;
  promptVersionsA: string[];
  promptVersionsB: string[];
  toolsAdded: string[];
  toolsRemoved: string[];
  verifierPassRateDelta: number;
  outputChanged: boolean;
  gradeScoreDelta: number | null;
  regressionDetected: boolean;
  regressionReasons: string[];
}

export interface RegressionThresholds {
  latencyRegressionMs?: number;
  costRegressionUsd?: number;
  errorCountIncrease?: number;
  groundTruthScoreDrop?: number;
  gradeScoreDrop?: number;
}

const DEFAULT_REGRESSION_THRESHOLDS: RegressionThresholds = {
  latencyRegressionMs: 500,
  costRegressionUsd: 0.01,
  errorCountIncrease: 1,
  gradeScoreDrop: 0.1,
};

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

    for (const verifier of tree.trace.verifierDecisions) {
      visitor.onVerifierDecision?.(verifier, tree.trace);
    }

    for (const reflection of tree.trace.reflections) {
      visitor.onReflection?.(reflection, tree.trace);
    }

    for (const rollback of tree.trace.rollbackPoints) {
      visitor.onRollbackPoint?.(rollback, tree.trace);
    }

    function visitSpan(node: SpanTree): void {
      visitor.onSpan?.(node.span, tree!.trace);
      for (const child of node.children) visitSpan(child);
    }
    for (const root of tree.spans) visitSpan(root);

    visitor.onTraceEnd?.(tree.trace);
  }

  compareTraces(
    traceIdA: string,
    traceIdB: string,
    thresholds: RegressionThresholds = DEFAULT_REGRESSION_THRESHOLDS,
  ): TraceDiff {
    const a = this.store.get(traceIdA);
    const b = this.store.get(traceIdB);
    if (!a) throw new Error(`Trace not found: ${traceIdA}`);
    if (!b) throw new Error(`Trace not found: ${traceIdB}`);

    const latencyDeltaMs = (b.latencyMs ?? 0) - (a.latencyMs ?? 0);
    const tokenDelta = (b.totalTokens ?? 0) - (a.totalTokens ?? 0);
    const costDeltaUsd = (b.costUsd ?? 0) - (a.costUsd ?? 0);
    const toolCallCountDelta = b.toolCalls.length - a.toolCalls.length;
    const errorCountDelta = b.errors.length - a.errors.length;
    const retrialDelta = b.retries - a.retries;

    const modelChanged = (b.model ?? '') !== (a.model ?? '');
    const modelsA = new Set(a.modelsUsed);
    const modelsB = new Set(b.modelsUsed);
    const modelsAdded = [...modelsB].filter((m) => !modelsA.has(m));
    const modelsRemoved = [...modelsA].filter((m) => !modelsB.has(m));

    const promptVersionsChanged =
      JSON.stringify([...a.promptVersions].sort()) !== JSON.stringify([...b.promptVersions].sort());

    const toolNamesA = new Set(a.toolCalls.map((t) => t.toolName));
    const toolNamesB = new Set(b.toolCalls.map((t) => t.toolName));
    const toolsAdded = [...toolNamesB].filter((t) => !toolNamesA.has(t));
    const toolsRemoved = [...toolNamesA].filter((t) => !toolNamesB.has(t));

    const verifierPassRateA = calcVerifierPassRate(a);
    const verifierPassRateB = calcVerifierPassRate(b);
    const verifierPassRateDelta = verifierPassRateB - verifierPassRateA;

    const outputChanged = JSON.stringify(a.output ?? null) !== JSON.stringify(b.output ?? null);

    const gradeA = a.grade?.score ?? null;
    const gradeB = b.grade?.score ?? null;
    const gradeScoreDelta = gradeA !== null && gradeB !== null ? gradeB - gradeA : null;

    const regressionReasons: string[] = [];
    if (
      thresholds.latencyRegressionMs !== undefined &&
      latencyDeltaMs > thresholds.latencyRegressionMs
    ) {
      regressionReasons.push(
        `Latency increased by ${latencyDeltaMs}ms (threshold: ${thresholds.latencyRegressionMs}ms)`,
      );
    }
    if (thresholds.costRegressionUsd !== undefined && costDeltaUsd > thresholds.costRegressionUsd) {
      regressionReasons.push(
        `Cost increased by $${costDeltaUsd.toFixed(4)} (threshold: $${thresholds.costRegressionUsd})`,
      );
    }
    if (
      thresholds.errorCountIncrease !== undefined &&
      errorCountDelta >= thresholds.errorCountIncrease
    ) {
      regressionReasons.push(
        `Error count increased by ${errorCountDelta} (threshold: ${thresholds.errorCountIncrease})`,
      );
    }
    if (
      thresholds.gradeScoreDrop !== undefined &&
      gradeScoreDelta !== null &&
      gradeScoreDelta < -thresholds.gradeScoreDrop
    ) {
      regressionReasons.push(
        `Grade score dropped by ${Math.abs(gradeScoreDelta).toFixed(3)} (threshold: ${thresholds.gradeScoreDrop})`,
      );
    }

    return {
      latencyDeltaMs,
      tokenDelta,
      costDeltaUsd,
      toolCallCountDelta,
      errorCountDelta,
      retrialDelta,
      statusA: a.status,
      statusB: b.status,
      modelChanged,
      modelsAdded,
      modelsRemoved,
      promptVersionsChanged,
      promptVersionsA: a.promptVersions,
      promptVersionsB: b.promptVersions,
      toolsAdded,
      toolsRemoved,
      verifierPassRateDelta,
      outputChanged,
      gradeScoreDelta,
      regressionDetected: regressionReasons.length > 0,
      regressionReasons,
    };
  }

  detectRegressions(
    baselineTraceId: string,
    candidateTraceIds: string[],
    thresholds: RegressionThresholds = DEFAULT_REGRESSION_THRESHOLDS,
  ): Array<{ candidateTraceId: string; diff: TraceDiff }> {
    return candidateTraceIds
      .map((id) => ({
        candidateTraceId: id,
        diff: this.compareTraces(baselineTraceId, id, thresholds),
      }))
      .filter((r) => r.diff.regressionDetected);
  }
}

function calcVerifierPassRate(trace: TraceRecord): number {
  if (trace.verifierDecisions.length === 0) return 1.0;
  const passes = trace.verifierDecisions.filter((v) => v.outcome === 'pass').length;
  return passes / trace.verifierDecisions.length;
}

export interface TraceReplayVisitor {
  onTraceStart?: (trace: TraceRecord) => void;
  onTraceEnd?: (trace: TraceRecord) => void;
  onToolCall?: (call: TraceRecord['toolCalls'][0], trace: TraceRecord) => void;
  onRetrieval?: (retrieval: TraceRecord['retrieval'][0], trace: TraceRecord) => void;
  onMemoryIO?: (io: TraceRecord['memoryIO'][0], trace: TraceRecord) => void;
  onGuardrailResult?: (result: TraceRecord['guardrailResults'][0], trace: TraceRecord) => void;
  onVerifierDecision?: (decision: TraceRecord['verifierDecisions'][0], trace: TraceRecord) => void;
  onReflection?: (reflection: TraceRecord['reflections'][0], trace: TraceRecord) => void;
  onRollbackPoint?: (point: TraceRecord['rollbackPoints'][0], trace: TraceRecord) => void;
  onSpan?: (span: TraceSpan, trace: TraceRecord) => void;
}

export const defaultReplayer = new TraceReplayer(defaultTraceStore);
