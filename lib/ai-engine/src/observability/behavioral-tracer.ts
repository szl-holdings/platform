/**
 * AgentOps Behavioral Observability
 *
 * Capability 5: Purpose-built observability layer that traces every decision fork
 * across non-deterministic multi-agent workflows.
 *
 * Features:
 *   - Decision fork tracing: which agents were routed, what context they received,
 *     what tools they called, and what they returned
 *   - LLM-as-judge replay evaluation: score traces for quality, safety, correctness
 *   - Visual decision-tree data structure for the Aegis/Firestorm dashboard
 *   - Behavioral regression detection: compare new traces against baseline
 */

import { randomUUID } from "crypto";

export type DecisionForkType = "routing" | "tool_call" | "validation" | "synthesis" | "escalation" | "governance_check";

export interface DecisionFork {
  forkId: string;
  parentForkId: string | null;
  traceId: string;
  forkType: DecisionForkType;
  agentId: string;
  agentName: string;
  domain: string;
  inputContext: string;
  decision: string;
  output: string;
  alternatives: Array<{ option: string; reason: string }>;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  confidence: number;
  latencyMs: number;
  tokensUsed: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface ExecutionTrace {
  traceId: string;
  runId: string;
  query: string;
  orgId: number | null;
  forks: DecisionFork[];
  startTime: string;
  endTime: string | null;
  totalLatencyMs: number;
  status: "in_progress" | "completed" | "failed";
  judgeEvaluation: JudgeEvaluation | null;
  decisionTree: DecisionTreeNode | null;
  regressionFlags: string[];
}

export interface JudgeEvaluation {
  traceId: string;
  qualityScore: number;
  safetyScore: number;
  correctnessScore: number;
  efficiencyScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  regressionDetected: boolean;
  evaluatedAt: string;
  evaluatorModel: string;
}

export interface DecisionTreeNode {
  forkId: string;
  label: string;
  forkType: DecisionForkType;
  agentId: string;
  confidence: number;
  latencyMs: number;
  children: DecisionTreeNode[];
  metadata: Record<string, unknown>;
}

function buildDecisionTree(forks: DecisionFork[]): DecisionTreeNode | null {
  if (forks.length === 0) return null;

  const nodeMap = new Map<string, DecisionTreeNode>();
  for (const fork of forks) {
    nodeMap.set(fork.forkId, {
      forkId: fork.forkId,
      label: fork.toolName ? `${fork.agentName}:${fork.toolName}` : `${fork.agentName} (${fork.forkType})`,
      forkType: fork.forkType,
      agentId: fork.agentId,
      confidence: fork.confidence,
      latencyMs: fork.latencyMs,
      children: [],
      metadata: { domain: fork.domain, decision: fork.decision.slice(0, 100), ...fork.metadata },
    });
  }

  let root: DecisionTreeNode | null = null;
  for (const fork of forks) {
    const node = nodeMap.get(fork.forkId)!;
    if (fork.parentForkId && nodeMap.has(fork.parentForkId)) {
      nodeMap.get(fork.parentForkId)!.children.push(node);
    } else {
      root = node;
    }
  }

  return root ?? nodeMap.values().next().value ?? null;
}

function heuristicJudge(trace: ExecutionTrace): JudgeEvaluation {
  const forks = trace.forks;
  const agentForks = forks.filter(f => f.forkType === "routing");
  const toolForks = forks.filter(f => f.forkType === "tool_call");
  const validationForks = forks.filter(f => f.forkType === "validation");

  const avgConfidence = forks.length > 0
    ? forks.reduce((s, f) => s + f.confidence, 0) / forks.length : 0;

  const qualityScore = Math.min(1, (
    (avgConfidence / 100) * 0.4 +
    (agentForks.length > 0 ? 0.3 : 0) +
    (validationForks.some(f => f.output.includes("APPROVED")) ? 0.2 : 0.1) +
    (toolForks.length > 0 ? 0.1 : 0)
  ));

  const hasEscalations = forks.some(f => f.forkType === "escalation");
  const hasGovernanceBlocks = forks.some(f => f.forkType === "governance_check" && f.output.includes("blocked"));
  const safetyScore = Math.min(1, (
    (hasGovernanceBlocks ? 0.1 : 0.4) +
    (validationForks.length > 0 ? 0.3 : 0.1) +
    (hasEscalations ? 0.3 : 0.2)
  ));

  const latencyPenalty = trace.totalLatencyMs > 30000 ? 0.1 : trace.totalLatencyMs > 15000 ? 0.2 : 0;
  const correctnessScore = Math.min(1, (avgConfidence / 100) * 0.7 + 0.3 - latencyPenalty);

  const totalTokens = forks.reduce((s, f) => s + f.tokensUsed, 0);
  const efficiencyScore = Math.min(1, (
    Math.min(1, 10000 / Math.max(1, totalTokens)) * 0.5 +
    Math.min(1, 20000 / Math.max(1, trace.totalLatencyMs)) * 0.5
  ));

  const overallScore = qualityScore * 0.3 + safetyScore * 0.3 + correctnessScore * 0.25 + efficiencyScore * 0.15;

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (avgConfidence > 75) strengths.push("High average agent confidence");
  if (validationForks.some(f => f.output.includes("APPROVED"))) strengths.push("Maker-checker validation passed");
  if (agentForks.length > 1) strengths.push("Multi-agent coordination engaged");
  if (efficiencyScore > 0.7) strengths.push("Token and latency efficient");

  if (avgConfidence < 50) weaknesses.push("Low average agent confidence");
  if (hasGovernanceBlocks) weaknesses.push("Governance blocks triggered — review policy configuration");
  if (trace.totalLatencyMs > 30000) weaknesses.push("High latency (>30s) — consider model downgrade");
  if (forks.length === 0) weaknesses.push("No decision forks captured — tracing may be incomplete");

  return {
    traceId: trace.traceId,
    qualityScore,
    safetyScore,
    correctnessScore,
    efficiencyScore,
    overallScore,
    strengths,
    weaknesses,
    regressionDetected: false,
    evaluatedAt: new Date().toISOString(),
    evaluatorModel: "heuristic-v1",
  };
}

const BEHAVIORAL_BASELINES: Map<string, { avgConfidence: number; avgLatency: number; avgTokens: number }> = new Map();
const REGRESSION_THRESHOLD = 0.15;

function detectRegression(trace: ExecutionTrace, orgId: string): string[] {
  const flags: string[] = [];
  const baseline = BEHAVIORAL_BASELINES.get(orgId);
  if (!baseline) return flags;

  const avgConf = trace.forks.length > 0 ? trace.forks.reduce((s, f) => s + f.confidence, 0) / trace.forks.length : 0;
  const confDelta = (baseline.avgConfidence - avgConf) / Math.max(1, baseline.avgConfidence);
  if (confDelta > REGRESSION_THRESHOLD) flags.push(`Confidence regression: ${(confDelta * 100).toFixed(1)}% below baseline`);

  const latDelta = (trace.totalLatencyMs - baseline.avgLatency) / Math.max(1, baseline.avgLatency);
  if (latDelta > REGRESSION_THRESHOLD * 2) flags.push(`Latency regression: ${(latDelta * 100).toFixed(1)}% above baseline`);

  return flags;
}

function updateBaseline(trace: ExecutionTrace, orgId: string): void {
  const avgConf = trace.forks.length > 0 ? trace.forks.reduce((s, f) => s + f.confidence, 0) / trace.forks.length : 0;
  const totalTokens = trace.forks.reduce((s, f) => s + f.tokensUsed, 0);
  const existing = BEHAVIORAL_BASELINES.get(orgId);
  if (!existing) {
    BEHAVIORAL_BASELINES.set(orgId, { avgConfidence: avgConf, avgLatency: trace.totalLatencyMs, avgTokens: totalTokens });
  } else {
    const alpha = 0.1;
    BEHAVIORAL_BASELINES.set(orgId, {
      avgConfidence: existing.avgConfidence * (1 - alpha) + avgConf * alpha,
      avgLatency: existing.avgLatency * (1 - alpha) + trace.totalLatencyMs * alpha,
      avgTokens: existing.avgTokens * (1 - alpha) + totalTokens * alpha,
    });
  }
}

class BehavioralTracer {
  private activeTraces: Map<string, ExecutionTrace> = new Map();
  private completedTraces: ExecutionTrace[] = [];
  private static readonly MAX_COMPLETED = 1000;

  startTrace(query: string, orgId?: number | null): { traceId: string; runId: string } {
    const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const runId = `run_${Date.now()}`;
    const trace: ExecutionTrace = {
      traceId,
      runId,
      query,
      orgId: orgId ?? null,
      forks: [],
      startTime: new Date().toISOString(),
      endTime: null,
      totalLatencyMs: 0,
      status: "in_progress",
      judgeEvaluation: null,
      decisionTree: null,
      regressionFlags: [],
    };
    this.activeTraces.set(traceId, trace);
    return { traceId, runId };
  }

  recordFork(traceId: string, fork: Omit<DecisionFork, "forkId" | "traceId" | "timestamp">): DecisionFork {
    const trace = this.activeTraces.get(traceId);
    const full: DecisionFork = {
      forkId: `fork_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      traceId,
      timestamp: new Date().toISOString(),
      ...fork,
    };
    if (trace) trace.forks.push(full);
    return full;
  }

  endTrace(traceId: string, status: "completed" | "failed" = "completed"): ExecutionTrace | null {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;

    trace.endTime = new Date().toISOString();
    trace.totalLatencyMs = Date.now() - new Date(trace.startTime).getTime();
    trace.status = status;
    trace.decisionTree = buildDecisionTree(trace.forks);

    if (status === "completed") {
      trace.judgeEvaluation = heuristicJudge(trace);
      const orgKey = String(trace.orgId ?? "default");
      trace.regressionFlags = detectRegression(trace, orgKey);
      if (trace.regressionFlags.length > 0 && trace.judgeEvaluation) {
        trace.judgeEvaluation.regressionDetected = true;
      }
      updateBaseline(trace, orgKey);
    }

    this.activeTraces.delete(traceId);
    this.completedTraces.push(trace);
    if (this.completedTraces.length > BehavioralTracer.MAX_COMPLETED) {
      this.completedTraces.splice(0, this.completedTraces.length - BehavioralTracer.MAX_COMPLETED);
    }

    return trace;
  }

  getTrace(traceId: string): ExecutionTrace | null {
    return this.activeTraces.get(traceId) ?? this.completedTraces.find(t => t.traceId === traceId) ?? null;
  }

  getRecentTraces(limit = 20, orgId?: number): ExecutionTrace[] {
    const traces = orgId !== undefined
      ? this.completedTraces.filter(t => t.orgId === orgId)
      : this.completedTraces;
    return traces.slice(-limit).reverse();
  }

  getObservabilityStats(orgId?: number): {
    totalTraces: number;
    avgOverallScore: number;
    avgLatencyMs: number;
    regressionRate: number;
    topWeaknesses: string[];
  } {
    const traces = orgId !== undefined
      ? this.completedTraces.filter(t => t.orgId === orgId)
      : this.completedTraces;

    const withEval = traces.filter(t => t.judgeEvaluation);
    const avgScore = withEval.length > 0 ? withEval.reduce((s, t) => s + (t.judgeEvaluation?.overallScore ?? 0), 0) / withEval.length : 0;
    const avgLatency = traces.length > 0 ? traces.reduce((s, t) => s + t.totalLatencyMs, 0) / traces.length : 0;
    const regressions = traces.filter(t => t.regressionFlags.length > 0).length;

    const weaknessCounts = new Map<string, number>();
    for (const t of withEval) {
      for (const w of (t.judgeEvaluation?.weaknesses ?? [])) {
        weaknessCounts.set(w, (weaknessCounts.get(w) ?? 0) + 1);
      }
    }
    const topWeaknesses = [...weaknessCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);

    return {
      totalTraces: traces.length,
      avgOverallScore: avgScore,
      avgLatencyMs: avgLatency,
      regressionRate: traces.length > 0 ? regressions / traces.length : 0,
      topWeaknesses,
    };
  }
}

export const behavioralTracer = new BehavioralTracer();
