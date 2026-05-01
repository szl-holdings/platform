/**
 * Telemetry → cognitive-reflexive bridge.
 *
 * The validator flagged that cognitive telemetry (hallucination_rate,
 * retrieval_quality_score, confidence, citation_coverage,
 * approval_bottleneck_ms, value_at_risk_usd) was not being auto-wired
 * into the reflexivity loop — the engine only fired when something
 * else explicitly emitted a `cognitive-reflexive` signal.
 *
 * This bridge converts raw cognitive telemetry samples into typed
 * `cognitive-reflexive` payloads and emits them through a
 * `CognitiveReflexivityEngine` (which wraps them in the universal
 * Signal envelope and publishes onto the bus). The bridge is
 * deliberately stateless and pure; callers can plug it into any
 * polling or push pipeline (telemetry collector, dashboard refresh
 * tick, OTEL receiver, etc.).
 *
 * Each telemetry kind maps to a CognitiveSubtype and an `intensity`
 * derived from a deviation-from-target. The bridge does not propose
 * strategies itself — that is the engine's job; it only ensures the
 * engine *sees* the cognitive telemetry as first-class signals.
 */

import type { CognitiveReflexivityEngine } from './engine';
import type { CognitiveReflexivePayload, CognitiveSubtype } from './types';
import type { Signal } from '@workspace/ontology/signal';

export type CognitiveTelemetryMetric =
  | 'hallucination_rate'
  | 'retrieval_quality_score'
  | 'confidence'
  | 'citation_coverage'
  | 'approval_bottleneck_ms'
  | 'value_at_risk_usd';

export interface CognitiveTelemetrySample {
  metric: CognitiveTelemetryMetric;
  value: number;
  /** ISO-8601 timestamp; defaults to now. */
  observedAt?: string;
  /** Tenant ownership for the resulting signal. */
  tenantId?: string;
  /** Free-form labels — surface, lane, model, etc. */
  labels?: Record<string, string>;
  /** Optional originating signal/decision ids for provenance chain. */
  evidenceRefs?: string[];
  /** Which agent/runtime emitted this telemetry sample. */
  agentId?: string;
}

export interface BridgeOptions {
  /**
   * Per-metric targets used to derive deviation intensity. Defaults
   * encode reasonable system-wide goals; callers can override per
   * tenant or per surface.
   */
  targets?: Partial<Record<CognitiveTelemetryMetric, MetricTarget>>;
}

interface MetricTarget {
  /** Ideal value. */
  target: number;
  /**
   * Deviation that maps to intensity = 1.0. Intensities scale linearly
   * with |value - target| / scale, clipped to [0,1].
   */
  scale: number;
  /**
   * Direction that is *bad*. 'higher' means values above target are
   * concerning; 'lower' is the opposite; 'either' treats both
   * symmetrically.
   */
  worseDirection: 'higher' | 'lower' | 'either';
}

const DEFAULT_TARGETS: Record<CognitiveTelemetryMetric, MetricTarget> = {
  // Hallucination should be near zero. Anything above 5% is alarming.
  hallucination_rate: { target: 0, scale: 0.05, worseDirection: 'higher' },
  // Retrieval quality score is normalized [0,1]; below 0.8 is concerning.
  retrieval_quality_score: { target: 1, scale: 0.2, worseDirection: 'lower' },
  // Reported confidence floor; below 0.7 → re-route. Above 0.95 may
  // indicate over-confidence (hence 'either').
  confidence: { target: 0.85, scale: 0.15, worseDirection: 'either' },
  // Citations should cover ≥80% of generated claims.
  citation_coverage: { target: 1, scale: 0.2, worseDirection: 'lower' },
  // Approval bottleneck p95 ms — anything above 60s indicates governance lag.
  approval_bottleneck_ms: { target: 0, scale: 60_000, worseDirection: 'higher' },
  // Per-decision value at risk (USD). Above $10k requires reflective check.
  value_at_risk_usd: { target: 0, scale: 10_000, worseDirection: 'higher' },
};

const SUBTYPE_BY_METRIC: Record<CognitiveTelemetryMetric, CognitiveSubtype> = {
  hallucination_rate: 'telemetry.hallucination_rate_breach',
  retrieval_quality_score: 'telemetry.retrieval_quality_drop',
  confidence: 'telemetry.confidence_anomaly',
  citation_coverage: 'telemetry.citation_coverage_drop',
  approval_bottleneck_ms: 'telemetry.governance_bottleneck',
  value_at_risk_usd: 'telemetry.value_at_risk_spike',
};

const AFFECTED_DIMENSION_BY_METRIC: Record<
  CognitiveTelemetryMetric,
  CognitiveReflexivePayload['affectedDimension']
> = {
  hallucination_rate: 'confidence-floor',
  retrieval_quality_score: 'retrieval-depth',
  confidence: 'confidence-floor',
  citation_coverage: 'retrieval-depth',
  approval_bottleneck_ms: 'detection-tuning',
  value_at_risk_usd: 'lane',
};

function severityFor(metric: CognitiveTelemetryMetric, intensity: number): Signal['severity'] {
  if (metric === 'value_at_risk_usd' && intensity > 0.7) return 'critical';
  if (intensity > 0.8) return 'high';
  if (intensity > 0.5) return 'medium';
  if (intensity > 0.2) return 'low';
  return 'info';
}

function deviationIntensity(value: number, target: MetricTarget): number {
  const delta = value - target.target;
  if (target.worseDirection === 'higher' && delta <= 0) return 0;
  if (target.worseDirection === 'lower' && delta >= 0) return 0;
  const magnitude = Math.abs(delta);
  return clamp01(magnitude / target.scale);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Convert a single telemetry sample into a `cognitive-reflexive`
 * payload + emission options. Pure — does not touch the bus.
 */
export function telemetrySampleToPayload(
  sample: CognitiveTelemetrySample,
  opts: BridgeOptions = {},
): { payload: CognitiveReflexivePayload; emit: { tenantId?: string; severity: Signal['severity'] } } | null {
  const merged = { ...DEFAULT_TARGETS, ...(opts.targets ?? {}) };
  const target = merged[sample.metric];
  if (!target) return null;

  const intensity = deviationIntensity(sample.value, target);
  // Skip noise — emitting zero-intensity signals would just pollute
  // the bus. The engine only acts above triggerThreshold (default 0.4)
  // anyway, but we want at least *some* visible breach to emit.
  if (intensity < 0.05) return null;

  const observation =
    `${sample.metric}=${sample.value} ` +
    `(target ${target.target}, scale ${target.scale}) → intensity ${intensity.toFixed(2)}`;

  const payload: CognitiveReflexivePayload = {
    subtype: SUBTYPE_BY_METRIC[sample.metric],
    observation,
    intensity,
    evidenceRefs: sample.evidenceRefs ?? [],
    ...(sample.agentId !== undefined ? { agentId: sample.agentId } : {}),
    ...(AFFECTED_DIMENSION_BY_METRIC[sample.metric]
      ? { affectedDimension: AFFECTED_DIMENSION_BY_METRIC[sample.metric] }
      : {}),
    data: {
      metric: sample.metric,
      value: sample.value,
      target: target.target,
      scale: target.scale,
      worseDirection: target.worseDirection,
      observedAt: sample.observedAt ?? new Date().toISOString(),
      labels: sample.labels ?? {},
    },
  };

  return {
    payload,
    emit: {
      severity: severityFor(sample.metric, intensity),
      ...(sample.tenantId !== undefined ? { tenantId: sample.tenantId } : {}),
    },
  };
}

/**
 * Push a batch of cognitive telemetry samples through the engine.
 * Returns the number of signals actually emitted (after filtering
 * sub-noise samples).
 */
export function bridgeTelemetryToReflexivity(
  engine: CognitiveReflexivityEngine,
  samples: CognitiveTelemetrySample[],
  opts: BridgeOptions = {},
): { emitted: number; skipped: number } {
  let emitted = 0;
  let skipped = 0;
  for (const sample of samples) {
    const converted = telemetrySampleToPayload(sample, opts);
    if (!converted) {
      skipped++;
      continue;
    }
    try {
      engine.emit(converted.payload, converted.emit);
      emitted++;
    } catch {
      // Malformed sample shouldn't crash the bridge.
      skipped++;
    }
  }
  return { emitted, skipped };
}
