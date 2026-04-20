/**
 * @szl/substrate — Telemetry Layer
 *
 * OpenTelemetry traces, metrics, and structured logs emitted from every stage
 * on both the TypeScript runtime and Python worker. A stage with no telemetry
 * fails CI (enforced by the engine).
 *
 * Uses the existing cognitive-observability package as the collector backend.
 */

import type { AnyStage, PipelineRun, StageResult, ExecutionMode } from "./types.js";
import type { RoutingDecision as BudgetRoutingDecision } from "./budget-router.js";

// ─── Span Interface ───────────────────────────────────────────────────────────
// Minimal span contract compatible with OTel W3C trace context

export interface SubstrateSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  startTimeMs: number;
  endTimeMs?: number;
  status: "ok" | "error" | "unset";
  attributes: Record<string, string | number | boolean>;
  events: Array<{ name: string; timeMs: number; attributes?: Record<string, unknown> }>;
}

// ─── In-Memory Span Store ─────────────────────────────────────────────────────

const spanStore: SubstrateSpan[] = [];
const MAX_SPANS = 2000;

function storeSpan(span: SubstrateSpan): void {
  spanStore.unshift(span);
  if (spanStore.length > MAX_SPANS) spanStore.length = MAX_SPANS;
}

export function getRecentSpans(limit = 100): SubstrateSpan[] {
  return spanStore.slice(0, limit);
}

export function getRunSpans(traceId: string): SubstrateSpan[] {
  return spanStore.filter((s) => s.traceId === traceId);
}

// ─── Metrics Counters ─────────────────────────────────────────────────────────

interface MetricsState {
  pipelineRuns: number;
  pipelineFailures: number;
  stageExecutions: number;
  stageFailures: number;
  stageEscalations: number;
  humanEscalations: number;
  totalConfidence: number;
  confidenceSamples: number;
  totalDurationMs: number;
  durationSamples: number;
  byWorkflow: Record<string, { runs: number; failures: number }>;
  byStageType: Record<string, { count: number; failures: number }>;
}

const metrics: MetricsState = {
  pipelineRuns: 0,
  pipelineFailures: 0,
  stageExecutions: 0,
  stageFailures: 0,
  stageEscalations: 0,
  humanEscalations: 0,
  totalConfidence: 0,
  confidenceSamples: 0,
  totalDurationMs: 0,
  durationSamples: 0,
  byWorkflow: {},
  byStageType: {},
};

export function getMetrics(): Readonly<MetricsState> {
  return { ...metrics };
}

// ─── Telemetry Emitter ────────────────────────────────────────────────────────

export class SubstrateTelemetry {
  private readonly traceId: string;
  private readonly runId: string;
  private readonly workflowId: string;
  private readonly mode: ExecutionMode;
  private pipelineSpanId: string | null = null;

  constructor(run: PipelineRun) {
    this.traceId = run.traceId;
    this.runId = run.runId;
    this.workflowId = run.workflowId;
    this.mode = run.mode;
  }

  // ── Pipeline lifecycle ──

  pipelineStarted(run: PipelineRun): SubstrateSpan {
    const span: SubstrateSpan = {
      spanId: `span-pipeline-${this.runId}`,
      traceId: this.traceId,
      name: `substrate.pipeline.${run.workflowName}`,
      startTimeMs: Date.now(),
      status: "unset",
      attributes: {
        "substrate.workflow.id": this.workflowId,
        "substrate.workflow.name": run.workflowName,
        "substrate.run.id": this.runId,
        "substrate.mode": this.mode,
        "substrate.runtime": "typescript",
      },
      events: [],
    };

    this.pipelineSpanId = span.spanId;
    storeSpan(span);

    metrics.pipelineRuns++;
    metrics.byWorkflow[this.workflowId] ??= { runs: 0, failures: 0 };
    metrics.byWorkflow[this.workflowId]!.runs++;

    this.emitToCollector("pipeline_started", { runId: this.runId, workflowId: this.workflowId, mode: this.mode });
    return span;
  }

  pipelineCompleted(run: PipelineRun, durationMs: number): void {
    const span = spanStore.find((s) => s.spanId === this.pipelineSpanId);
    if (span) {
      span.endTimeMs = Date.now();
      span.status = run.status === "completed" || run.status === "dry-run-complete" ? "ok" : "error";
      span.attributes["substrate.final.confidence"] = run.finalConfidence ?? 0;
      span.attributes["substrate.duration.ms"] = durationMs;
      span.attributes["substrate.status"] = run.status;
    }

    if (run.status === "failed") {
      metrics.pipelineFailures++;
      metrics.byWorkflow[this.workflowId]!.failures++;
    }

    metrics.totalDurationMs += durationMs;
    metrics.durationSamples++;

    if (run.finalConfidence !== undefined) {
      metrics.totalConfidence += run.finalConfidence;
      metrics.confidenceSamples++;
    }

    this.emitToCollector("pipeline_completed", {
      runId: this.runId,
      status: run.status,
      durationMs,
      finalConfidence: run.finalConfidence,
    });
  }

  // ── Stage lifecycle ──

  stageStarted(stage: AnyStage, attempt: number): SubstrateSpan {
    const span: SubstrateSpan = {
      spanId: `span-stage-${this.runId}-${stage.id}-${attempt}`,
      traceId: this.traceId,
      ...(this.pipelineSpanId !== null ? { parentSpanId: this.pipelineSpanId } : {}),
      name: `substrate.stage.${stage.type.toLowerCase()}.${stage.id}`,
      startTimeMs: Date.now(),
      status: "unset",
      attributes: {
        "substrate.stage.id": stage.id,
        "substrate.stage.type": stage.type,
        "substrate.stage.name": stage.name,
        "substrate.stage.runtime": stage.runtime,
        "substrate.stage.attempt": attempt,
        "substrate.workflow.id": this.workflowId,
        "substrate.run.id": this.runId,
        "substrate.mode": this.mode,
        ...Object.fromEntries(
          Object.entries(stage.otelTags).map(([k, v]) => [`substrate.stage.tag.${k}`, v]),
        ),
      },
      events: [],
    };

    storeSpan(span);

    metrics.stageExecutions++;
    metrics.byStageType[stage.type] ??= { count: 0, failures: 0 };
    metrics.byStageType[stage.type]!.count++;

    return span;
  }

  stageCompleted(stage: AnyStage, result: StageResult, spanId: string): void {
    const span = spanStore.find((s) => s.spanId === spanId);
    if (span) {
      span.endTimeMs = Date.now();
      span.status = result.status === "completed" ? "ok" : "error";
      span.attributes["substrate.stage.status"] = result.status;
      span.attributes["substrate.stage.confidence"] = result.confidence ?? -1;
      span.attributes["substrate.stage.duration.ms"] = result.durationMs;
      if (result.routingDecision) {
        span.attributes["substrate.stage.routing"] = result.routingDecision;
      }
    }

    if (result.status === "failed" || result.status === "timed-out") {
      metrics.stageFailures++;
      metrics.byStageType[stage.type]!.failures++;
    }

    if (result.routingDecision === "escalated-model") metrics.stageEscalations++;
    if (result.routingDecision === "escalated-human") metrics.humanEscalations++;
  }

  // ── Events ──

  addEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void {
    const span = spanStore.find((s) => s.spanId === spanId);
    if (span) {
      span.events.push({ name, timeMs: Date.now(), ...(attributes !== undefined ? { attributes } : {}) });
    }
  }

  recordRoutingDecision(stage: AnyStage, decision: BudgetRoutingDecision, spanId: string): void {
    this.addEvent(spanId, "substrate.routing.decision", {
      action: decision.action,
      reason: decision.reason,
      stageId: stage.id,
    });
    this.emitToCollector("routing_decision", {
      stageId: stage.id,
      stageType: stage.type,
      action: decision.action,
    });
  }

  recordPolicyOutcome(stage: AnyStage, outcome: string, spanId: string): void {
    this.addEvent(spanId, "substrate.policy.outcome", { stageId: stage.id, outcome });
  }

  recordApprovalRequest(stage: AnyStage, approvalId: string, spanId: string): void {
    this.addEvent(spanId, "substrate.approval.requested", { stageId: stage.id, approvalId });
  }

  // ── Collector bridge ──

  private emitToCollector(eventType: string, data: Record<string, unknown>): void {
    // Non-fatal — cognitive-observability may not be available in all environments.
    // We use latency_ms as a proxy metric for pipeline events; the labels carry semantics.
    Promise.resolve()
      .then(async () => {
        const { globalCollector } = await import("@workspace/cognitive-observability");
        globalCollector.recordKnown("latency_ms", 0, {
          substrate_event: eventType,
          workflowId: this.workflowId,
          runId: this.runId,
          ...Object.fromEntries(
            Object.entries(data)
              .slice(0, 10)
              .map(([k, v]) => [k, String(v)]),
          ),
        });
      })
      .catch(() => {
        // cognitive-observability is best-effort; never fail the pipeline for telemetry
      });
  }
}
