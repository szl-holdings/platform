/**
 * AI Trace Capture
 *
 * Captures detailed execution traces for every AI-assisted flow:
 * model identity, prompt hash, latency, cost estimate, confidence,
 * domain, recommendation type, and outcome signal.
 *
 * Traces feed:
 *  - The offline evaluator (golden-set regression)
 *  - The online review queue (low-confidence / high-risk escalation)
 *  - The AI Ops dashboard (cost, latency, quality aggregates)
 *  - The Outcome Graph (recommendation lifecycle)
 */

import { createHash } from "crypto";

export type RecommendationType =
  | "risk_assessment"
  | "threat_triage"
  | "owner_suggestion"
  | "deal_analysis"
  | "voyage_pnl"
  | "sanctions_check"
  | "legal_matter"
  | "escalation_proposal"
  | "workflow_template"
  | "anomaly_detection"
  | "generic";

export type TraceDomain =
  | "aegis"
  | "terra"
  | "vessels"
  | "prism_counsel"
  | "alloy"
  | "lyte"
  | "cortex"
  | "global";

export type TraceStatus = "pending" | "evaluated" | "reviewed" | "flagged" | "archived";

export interface AITrace {
  traceId: string;
  correlationId?: string;
  orgId?: number | null;
  agentId?: string;
  model: string;
  modelProvider: string;
  modelVersion?: string;
  routeClass?: string;
  domain: TraceDomain;
  recommendationType: RecommendationType;
  promptHash: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  costEstimateUsd: number;
  confidence: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  requiresReview: boolean;
  reviewReason?: string;
  proofChainId?: number;
  outcomeGraphId?: number;
  inputSummary?: string;
  outputSummary?: string;
  toolsUsed?: string[];
  evalScore?: number;
  evalPassed?: boolean;
  status: TraceStatus;
  metadata?: Record<string, unknown>;
  capturedAt: string;
}

export interface TraceCaptureInput {
  correlationId?: string;
  orgId?: number | null;
  agentId?: string;
  model: string;
  modelProvider: string;
  modelVersion?: string;
  routeClass?: string;
  domain: TraceDomain;
  recommendationType: RecommendationType;
  promptText: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
  costEstimateUsd?: number;
  confidence?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  proofChainId?: number;
  outcomeGraphId?: number;
  inputSummary?: string;
  outputSummary?: string;
  toolsUsed?: string[];
  metadata?: Record<string, unknown>;
}

export const REVIEW_CONFIDENCE_THRESHOLD = 0.55;
export const REVIEW_HIGH_RISK_LEVELS: Array<"high" | "critical"> = ["high", "critical"];
export const REVIEW_COST_THRESHOLD_USD = 0.50;

const inMemoryTraces: AITrace[] = [];
const MAX_IN_MEMORY_TRACES = 5000;

let externalSink: ((trace: AITrace) => Promise<void>) | null = null;
let externalUpdateSink: ((traceId: string, status: TraceStatus, evalScore?: number, evalPassed?: boolean) => Promise<void>) | null = null;

export function registerTraceSink(sink: (trace: AITrace) => Promise<void>): void {
  externalSink = sink;
}

export function registerTraceUpdateSink(sink: (traceId: string, status: TraceStatus, evalScore?: number, evalPassed?: boolean) => Promise<void>): void {
  externalUpdateSink = sink;
}

function computePromptHash(promptText: string): string {
  return createHash("sha256").update(promptText).digest("hex").slice(0, 16);
}

function shouldRequireReview(input: TraceCaptureInput): { required: boolean; reason?: string } {
  const confidence = input.confidence ?? 1.0;
  if (confidence < REVIEW_CONFIDENCE_THRESHOLD) {
    return { required: true, reason: `Low confidence: ${confidence.toFixed(2)} < ${REVIEW_CONFIDENCE_THRESHOLD}` };
  }
  if (input.riskLevel && REVIEW_HIGH_RISK_LEVELS.includes(input.riskLevel as "high" | "critical")) {
    return { required: true, reason: `High-risk recommendation: ${input.riskLevel}` };
  }
  if ((input.costEstimateUsd ?? 0) > REVIEW_COST_THRESHOLD_USD) {
    return { required: true, reason: `High cost: $${input.costEstimateUsd?.toFixed(4)} > $${REVIEW_COST_THRESHOLD_USD}` };
  }
  return { required: false };
}

export function captureTrace(input: TraceCaptureInput): AITrace {
  const traceId = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const reviewCheck = shouldRequireReview(input);

  const trace: AITrace = {
    traceId,
    correlationId: input.correlationId,
    orgId: input.orgId,
    agentId: input.agentId,
    model: input.model,
    modelProvider: input.modelProvider,
    modelVersion: input.modelVersion,
    routeClass: input.routeClass,
    domain: input.domain,
    recommendationType: input.recommendationType,
    promptHash: computePromptHash(input.promptText),
    promptTokens: input.promptTokens ?? 0,
    completionTokens: input.completionTokens ?? 0,
    latencyMs: input.latencyMs,
    costEstimateUsd: input.costEstimateUsd ?? 0,
    confidence: input.confidence ?? 1.0,
    riskLevel: input.riskLevel,
    requiresReview: reviewCheck.required,
    reviewReason: reviewCheck.reason,
    proofChainId: input.proofChainId,
    outcomeGraphId: input.outcomeGraphId,
    inputSummary: input.inputSummary,
    outputSummary: input.outputSummary,
    toolsUsed: input.toolsUsed,
    status: "pending",
    metadata: input.metadata,
    capturedAt: new Date().toISOString(),
  };

  inMemoryTraces.unshift(trace);
  if (inMemoryTraces.length > MAX_IN_MEMORY_TRACES) {
    inMemoryTraces.length = MAX_IN_MEMORY_TRACES;
  }

  if (externalSink) {
    externalSink(trace).catch((err) => {
      console.error("[ai-engine/trace-capture] sink write failed for traceId=%s: %s", trace.traceId, err instanceof Error ? err.message : String(err));
    });
  }

  return trace;
}

export function hydrateTraces(traces: AITrace[]): void {
  for (const trace of traces) {
    if (!inMemoryTraces.find(t => t.traceId === trace.traceId)) {
      inMemoryTraces.push(trace);
    }
  }
  inMemoryTraces.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
  if (inMemoryTraces.length > MAX_IN_MEMORY_TRACES) {
    inMemoryTraces.length = MAX_IN_MEMORY_TRACES;
  }
}

export function getTrace(traceId: string): AITrace | undefined {
  return inMemoryTraces.find(t => t.traceId === traceId);
}

export function listTraces(options: {
  orgId?: number;
  domain?: TraceDomain;
  requiresReview?: boolean;
  status?: TraceStatus;
  riskLevel?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
} = {}): AITrace[] {
  let results = inMemoryTraces;

  if (options.orgId != null) results = results.filter(t => t.orgId === options.orgId);
  if (options.domain) results = results.filter(t => t.domain === options.domain);
  if (options.requiresReview != null) results = results.filter(t => t.requiresReview === options.requiresReview);
  if (options.status) results = results.filter(t => t.status === options.status);
  if (options.riskLevel) results = results.filter(t => t.riskLevel === options.riskLevel);
  if (options.since) results = results.filter(t => new Date(t.capturedAt) >= options.since!);
  if (options.until) results = results.filter(t => new Date(t.capturedAt) <= options.until!);

  const offset = options.offset ?? 0;
  const limit = options.limit ?? 100;
  return results.slice(offset, offset + limit);
}

export function updateTraceStatus(traceId: string, status: TraceStatus, evalScore?: number, evalPassed?: boolean): boolean {
  const trace = inMemoryTraces.find(t => t.traceId === traceId);
  if (!trace) return false;
  trace.status = status;
  if (evalScore != null) trace.evalScore = evalScore;
  if (evalPassed != null) trace.evalPassed = evalPassed;

  if (externalUpdateSink) {
    externalUpdateSink(traceId, status, evalScore, evalPassed).catch((err) => {
      console.error("[ai-engine/trace-capture] update sink failed for traceId=%s: %s", traceId, err instanceof Error ? err.message : String(err));
    });
  }

  return true;
}

export interface TraceAggregate {
  domain: string;
  totalTraces: number;
  reviewRequired: number;
  avgConfidence: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  evalPassRate: number | null;
  byRiskLevel: Record<string, number>;
}

export function aggregateTraces(options: { orgId?: number; since?: Date } = {}): TraceAggregate[] {
  let traces = inMemoryTraces;
  if (options.orgId != null) traces = traces.filter(t => t.orgId === options.orgId);
  if (options.since) traces = traces.filter(t => new Date(t.capturedAt) >= options.since!);

  const byDomain = new Map<string, AITrace[]>();
  for (const t of traces) {
    const existing = byDomain.get(t.domain) ?? [];
    existing.push(t);
    byDomain.set(t.domain, existing);
  }

  return Array.from(byDomain.entries()).map(([domain, domainTraces]) => {
    const evaluated = domainTraces.filter(t => t.evalPassed != null);
    const passed = evaluated.filter(t => t.evalPassed).length;
    return {
      domain,
      totalTraces: domainTraces.length,
      reviewRequired: domainTraces.filter(t => t.requiresReview).length,
      avgConfidence: domainTraces.reduce((s, t) => s + t.confidence, 0) / domainTraces.length,
      avgLatencyMs: domainTraces.reduce((s, t) => s + t.latencyMs, 0) / domainTraces.length,
      totalCostUsd: domainTraces.reduce((s, t) => s + t.costEstimateUsd, 0),
      evalPassRate: evaluated.length > 0 ? passed / evaluated.length : null,
      byRiskLevel: domainTraces.reduce((acc, t) => {
        if (t.riskLevel) acc[t.riskLevel] = (acc[t.riskLevel] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  });
}
