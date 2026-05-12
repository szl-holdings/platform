/**
 * OpenTelemetry Bridge — emits Horizon primitives as OTel GenAI spans/metrics.
 *
 * Why OTel?
 *   - The OpenTelemetry GenAI semantic conventions (spec at
 *     https://opentelemetry.io/docs/specs/semconv/gen-ai/) are becoming the
 *     industry standard for AI-system observability. Langfuse, Arize, Honeycomb,
 *     Datadog, and others ingest GenAI spans natively.
 *   - By emitting Horizon primitives as OTel attributes on existing GenAI spans,
 *     Ouroboros telemetry plugs into every existing AI observability backend
 *     without bespoke adapters.
 *
 * Conventions used here:
 *   - Operation names from spec: gen_ai.operation.name ∈ { invoke_agent, execute_tool, ... }
 *   - Agent attributes: gen_ai.agent.id, gen_ai.agent.name
 *   - Custom Horizon attributes namespaced under `ouroboros.horizon.*`
 *
 * This module is intentionally side-effect-free at import time. You construct
 * a HorizonOtelBridge with your tracer and call its methods to emit spans
 * and attributes. It does not configure or start the OTel SDK; that's the
 * embedding application's job (e.g. Langfuse SDK initialization).
 */

import { trace, SpanStatusCode, type Span, type Tracer } from "@opentelemetry/api";
import type { DualWitnessResult, LoopId, NoHairState, PageCurveResult } from "./types.js";
import type { CapacityHorizonReading, HorizonRecommendation } from "./horizon.js";
import type { EntanglementEdge } from "./entanglement.js";
import { serializeNoHair } from "./no-hair.js";

/**
 * OTel GenAI semantic-convention operation names that Horizon emits.
 */
export const GenAIOperation = {
  InvokeAgent: "invoke_agent",
  ExecuteTool: "execute_tool",
  InvokeWorkflow: "invoke_workflow",
  CreateAgent: "create_agent",
} as const;

export type GenAIOperationName =
  (typeof GenAIOperation)[keyof typeof GenAIOperation];

const HORIZON_NS = "ouroboros.horizon";

export interface BridgeConfig {
  /** Tracer name; defaults to "@workspace/ouroboros-horizon". */
  readonly tracerName?: string;
  /** Tracer version; defaults to package version. */
  readonly tracerVersion?: string;
}

/**
 * Bridge from Horizon primitives to OTel GenAI spans and metrics.
 */
export class HorizonOtelBridge {
  private readonly tracer: Tracer;

  constructor(cfg: BridgeConfig = {}) {
    this.tracer = trace.getTracer(
      cfg.tracerName ?? "@workspace/ouroboros-horizon",
      cfg.tracerVersion ?? "0.1.0",
    );
  }

  /**
   * Wrap a loop invocation as an OTel `invoke_agent` span. Returns the span
   * for the caller to set additional attributes and end. Per OTel GenAI
   * semconv, the span name is `invoke_agent <agent.name>`.
   */
  startLoopSpan(args: {
    loopId: LoopId;
    operation?: GenAIOperationName;
    agentName?: string;
    agentId?: string;
    agentVersion?: string;
    systemProvider?: string; // e.g. "perplexity", "openai"
  }): Span {
    const op = args.operation ?? GenAIOperation.InvokeAgent;
    const name = args.agentName ?? args.loopId;
    const span = this.tracer.startSpan(`${op} ${name}`);
    span.setAttribute("gen_ai.operation.name", op);
    if (args.systemProvider) {
      span.setAttribute("gen_ai.system", args.systemProvider);
    }
    if (args.agentId) span.setAttribute("gen_ai.agent.id", args.agentId);
    if (args.agentName) span.setAttribute("gen_ai.agent.name", args.agentName);
    if (args.agentVersion) {
      span.setAttribute("gen_ai.agent.version", args.agentVersion);
    }
    span.setAttribute(`${HORIZON_NS}.loop.id`, args.loopId);
    return span;
  }

  /**
   * Attach Page-curve summary attributes to a span. Call right before
   * span.end() at loop close.
   */
  attachPageCurve(span: Span, result: PageCurveResult): void {
    span.setAttribute(`${HORIZON_NS}.page_curve.clean`, result.clean);
    span.setAttribute(
      `${HORIZON_NS}.page_curve.residual_bits`,
      result.residualEntropy,
    );
    span.setAttribute(`${HORIZON_NS}.page_curve.epsilon`, result.epsilon);
    span.setAttribute(
      `${HORIZON_NS}.page_curve.peak_bits`,
      result.pageEntropy,
    );
    if (result.pageTick !== null) {
      span.setAttribute(`${HORIZON_NS}.page_curve.peak_tick`, result.pageTick);
    }
    span.setAttribute(
      `${HORIZON_NS}.page_curve.monotonic_rise`,
      result.monotonicRise,
    );
    span.setAttribute(
      `${HORIZON_NS}.page_curve.monotonic_fall`,
      result.monotonicFall,
    );
    if (!result.clean) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `dirty close: residual entropy ${result.residualEntropy.toFixed(4)} bits > ε=${result.epsilon}`,
      });
    }
  }

  /** Attach the no-hair canonical state to a span. */
  attachNoHair(span: Span, state: NoHairState): void {
    span.setAttribute(`${HORIZON_NS}.no_hair.mass`, state.mass);
    span.setAttribute(`${HORIZON_NS}.no_hair.charge`, state.charge);
    span.setAttribute(`${HORIZON_NS}.no_hair.spin`, state.spin);
    span.setAttribute(`${HORIZON_NS}.no_hair.tier`, state.tier);
    span.setAttribute(`${HORIZON_NS}.no_hair.hash`, state.hash);
    span.setAttribute(`${HORIZON_NS}.no_hair.serialized`, serializeNoHair(state));
  }

  /** Attach dual-witness verification result to a span. */
  attachDualWitness(span: Span, result: DualWitnessResult): void {
    span.setAttribute(`${HORIZON_NS}.dual_witness.consistent`, result.consistent);
    span.setAttribute(
      `${HORIZON_NS}.dual_witness.orphans`,
      result.orphanedClaims.length,
    );
    span.setAttribute(`${HORIZON_NS}.dual_witness.range_from`, result.range.from);
    span.setAttribute(`${HORIZON_NS}.dual_witness.range_to`, result.range.to);
    if (!result.consistent) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `complementarity violation: ${result.orphanedClaims.length} orphaned internal claims`,
      });
    }
  }

  /** Attach a capacity horizon reading + recommendation to a span. */
  attachCapacityHorizon(
    span: Span,
    reading: CapacityHorizonReading,
    observedBitsPerTick: number,
    recommendation: HorizonRecommendation,
  ): void {
    span.setAttribute(`${HORIZON_NS}.capacity.bits`, reading.capacityBits);
    span.setAttribute(
      `${HORIZON_NS}.capacity.boundary`,
      reading.boundaryCardinality,
    );
    span.setAttribute(
      `${HORIZON_NS}.capacity.observed_bits_per_tick`,
      observedBitsPerTick,
    );
    span.setAttribute(`${HORIZON_NS}.capacity.recommendation`, recommendation);
  }

  /** Emit an entanglement edge as a span event on a parent span. */
  recordEntanglementEdge(span: Span, edge: EntanglementEdge): void {
    span.addEvent("ouroboros.horizon.entanglement_edge", {
      [`${HORIZON_NS}.entanglement.from`]: edge.from,
      [`${HORIZON_NS}.entanglement.to`]: edge.to,
      [`${HORIZON_NS}.entanglement.bits`]: edge.bits,
      [`${HORIZON_NS}.entanglement.distance`]: edge.distance,
    });
  }
}

/**
 * Convenience: attach all Horizon primitives in one call. Useful for
 * end-of-loop close where you have everything in hand.
 */
export function attachAllHorizon(
  bridge: HorizonOtelBridge,
  span: Span,
  bundle: {
    pageCurve?: PageCurveResult;
    noHair?: NoHairState;
    dualWitness?: DualWitnessResult;
    capacity?: {
      reading: CapacityHorizonReading;
      observedBitsPerTick: number;
      recommendation: HorizonRecommendation;
    };
    entanglementEdges?: readonly EntanglementEdge[];
  },
): void {
  if (bundle.pageCurve) bridge.attachPageCurve(span, bundle.pageCurve);
  if (bundle.noHair) bridge.attachNoHair(span, bundle.noHair);
  if (bundle.dualWitness) bridge.attachDualWitness(span, bundle.dualWitness);
  if (bundle.capacity) {
    bridge.attachCapacityHorizon(
      span,
      bundle.capacity.reading,
      bundle.capacity.observedBitsPerTick,
      bundle.capacity.recommendation,
    );
  }
  for (const edge of bundle.entanglementEdges ?? []) {
    bridge.recordEntanglementEdge(span, edge);
  }
}
