import { randomUUID } from 'node:crypto';

export interface EphemeralTrace {
  traceId: string;
  sessionId: string;
  explorationSteps: EphemeralStep[];
  totalTokensUsed: number;
  totalLatencyMs: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'concluded' | 'garbage_collected';
}

export interface EphemeralStep {
  stepId: string;
  stepType: 'explore' | 'branch' | 'backtrack' | 'synthesize';
  content: string;
  confidence: number;
  tokensUsed: number;
  latencyMs: number;
  parentStepId: string | null;
  depth: number;
  discarded: boolean;
  timestamp: string;
}

export interface EphemeralReasoningResult {
  sessionId: string;
  traceId: string;
  query: string;
  distilledConclusion: string;
  conclusionConfidence: number;
  explorationDepth: number;
  totalSteps: number;
  discardedSteps: number;
  totalTokensUsed: number;
  totalLatencyMs: number;
  traceAvailableUntil: string;
}

export interface EphemeralReasoningOptions {
  maxExplorationSteps?: number;
  maxDepth?: number;
  tokenBudget?: number;
  sessionTtlMs?: number;
  branchingFactor?: number;
}

type EphemeralLlmCaller = (
  prompt: string,
  maxTokens: number,
) => Promise<{ content: string; tokensUsed: number; latencyMs: number }>;

let _ephemeralCaller: EphemeralLlmCaller | null = null;

export function setEphemeralReasoningCaller(fn: EphemeralLlmCaller): void {
  _ephemeralCaller = fn;
}

const DEFAULT_MAX_STEPS = 8;
const DEFAULT_MAX_DEPTH = 4;
const DEFAULT_TOKEN_BUDGET = 12000;
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;
const DEFAULT_BRANCHING_FACTOR = 2;

const MAX_TRACES = 100;
const activeTraces = new Map<string, EphemeralTrace>();

function buildExplorationPrompt(query: string, priorSteps: EphemeralStep[]): string {
  const context = priorSteps
    .filter(s => !s.discarded)
    .map(s => `[depth=${s.depth}] ${s.content.slice(0, 300)}`)
    .join('\n');

  return [
    'You are a deep exploration engine. Explore one specific angle of this problem.',
    'Think divergently — consider unusual perspectives, edge cases, and non-obvious connections.',
    'Do NOT produce a final answer. Only explore and generate insights.',
    `\nProblem: ${query}`,
    context ? `\nPrior exploration:\n${context}` : '',
  ].join('\n');
}

function buildSynthesisPrompt(query: string, steps: EphemeralStep[]): string {
  const exploration = steps
    .filter(s => !s.discarded && s.stepType !== 'synthesize')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10)
    .map(s => `[confidence=${(s.confidence * 100).toFixed(0)}%] ${s.content.slice(0, 400)}`)
    .join('\n\n');

  return [
    'You are a synthesis engine. Distill the following exploration into a clear, calibrated conclusion.',
    'Only include insights that survived scrutiny. Acknowledge residual uncertainty.',
    'Be direct and well-structured.',
    `\nOriginal problem: ${query}`,
    `\nExploration results:\n${exploration}`,
  ].join('\n');
}

export async function runEphemeralReasoning(
  query: string,
  context: string,
  options: EphemeralReasoningOptions = {},
): Promise<EphemeralReasoningResult> {
  const sessionId = `eph_${randomUUID().slice(0, 12)}`;
  const maxSteps = options.maxExplorationSteps ?? DEFAULT_MAX_STEPS;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const tokenBudget = options.tokenBudget ?? DEFAULT_TOKEN_BUDGET;
  const sessionTtlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
  const startMs = Date.now();

  const trace: EphemeralTrace = {
    traceId: `ept_${randomUUID().slice(0, 12)}`,
    sessionId,
    explorationSteps: [],
    totalTokensUsed: 0,
    totalLatencyMs: 0,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
    status: 'active',
  };

  activeTraces.set(trace.traceId, trace);
  enforceTraceCapacity();

  if (!_ephemeralCaller) {
    trace.status = 'concluded';
    return {
      sessionId,
      traceId: trace.traceId,
      query,
      distilledConclusion: `[Ephemeral reasoning unavailable — caller not registered] Query: ${query.slice(0, 200)}`,
      conclusionConfidence: 0.3,
      explorationDepth: 0,
      totalSteps: 0,
      discardedSteps: 0,
      totalTokensUsed: 0,
      totalLatencyMs: 0,
      traceAvailableUntil: trace.expiresAt,
    };
  }

  let tokensRemaining = tokenBudget;
  let currentDepth = 0;

  for (let step = 0; step < maxSteps && tokensRemaining > 500 && currentDepth < maxDepth; step++) {
    const stepTokenBudget = Math.min(Math.floor(tokensRemaining * 0.3), 2000);
    const prompt = buildExplorationPrompt(
      context ? `${query}\n\nContext: ${context}` : query,
      trace.explorationSteps,
    );

    const result = await _ephemeralCaller(prompt, stepTokenBudget);

    const ephStep: EphemeralStep = {
      stepId: `es_${randomUUID().slice(0, 8)}`,
      stepType: 'explore',
      content: result.content,
      confidence: estimateStepConfidence(result.content),
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      parentStepId: trace.explorationSteps.length > 0
        ? trace.explorationSteps[trace.explorationSteps.length - 1]!.stepId
        : null,
      depth: currentDepth,
      discarded: false,
      timestamp: new Date().toISOString(),
    };

    trace.explorationSteps.push(ephStep);
    trace.totalTokensUsed += result.tokensUsed;
    tokensRemaining -= result.tokensUsed;

    if (ephStep.confidence < 0.3 && trace.explorationSteps.length > 2) {
      ephStep.discarded = true;
      ephStep.stepType = 'backtrack';
    } else {
      currentDepth = Math.min(currentDepth + 1, maxDepth);
    }
  }

  const synthesisTokenBudget = Math.min(tokensRemaining, 3000);
  const synthesisPrompt = buildSynthesisPrompt(query, trace.explorationSteps);
  const synthesisResult = await _ephemeralCaller(synthesisPrompt, synthesisTokenBudget);

  const synthesisStep: EphemeralStep = {
    stepId: `es_synth_${randomUUID().slice(0, 8)}`,
    stepType: 'synthesize',
    content: synthesisResult.content,
    confidence: estimateStepConfidence(synthesisResult.content),
    tokensUsed: synthesisResult.tokensUsed,
    latencyMs: synthesisResult.latencyMs,
    parentStepId: null,
    depth: 0,
    discarded: false,
    timestamp: new Date().toISOString(),
  };

  trace.explorationSteps.push(synthesisStep);
  trace.totalTokensUsed += synthesisResult.tokensUsed;
  trace.totalLatencyMs = Date.now() - startMs;
  trace.status = 'concluded';

  const discardedCount = trace.explorationSteps.filter(s => s.discarded).length;

  return {
    sessionId,
    traceId: trace.traceId,
    query,
    distilledConclusion: synthesisResult.content,
    conclusionConfidence: synthesisStep.confidence,
    explorationDepth: currentDepth,
    totalSteps: trace.explorationSteps.length,
    discardedSteps: discardedCount,
    totalTokensUsed: trace.totalTokensUsed,
    totalLatencyMs: trace.totalLatencyMs,
    traceAvailableUntil: trace.expiresAt,
  };
}

function estimateStepConfidence(content: string): number {
  const lower = content.toLowerCase();
  const hedges = ['uncertain', 'unclear', 'might', 'possibly', 'may', 'perhaps', 'insufficient'];
  const strong = ['therefore', 'clearly', 'demonstrates', 'confirms', 'evidence shows', 'analysis reveals'];

  const hedgeCount = hedges.filter(h => lower.includes(h)).length;
  const strongCount = strong.filter(s => lower.includes(s)).length;

  const base = 0.6;
  const penalty = hedgeCount * 0.05;
  const boost = strongCount * 0.05;

  return Math.max(0.2, Math.min(0.95, base - penalty + boost));
}

export function getEphemeralTrace(traceId: string): EphemeralTrace | null {
  const trace = activeTraces.get(traceId);
  if (!trace) return null;

  if (new Date(trace.expiresAt) < new Date()) {
    trace.status = 'garbage_collected';
    activeTraces.delete(traceId);
    return null;
  }

  return trace;
}

export function getEphemeralTraceBySessionId(sessionId: string): EphemeralTrace | null {
  for (const trace of activeTraces.values()) {
    if (trace.sessionId === sessionId) {
      if (new Date(trace.expiresAt) < new Date()) {
        trace.status = 'garbage_collected';
        activeTraces.delete(trace.traceId);
        return null;
      }
      return trace;
    }
  }
  return null;
}

export function garbageCollectTraces(): number {
  const now = Date.now();
  let collected = 0;
  for (const [id, trace] of activeTraces) {
    if (new Date(trace.expiresAt).getTime() < now) {
      trace.status = 'garbage_collected';
      activeTraces.delete(id);
      collected++;
    }
  }
  return collected;
}

export function getEphemeralStats(): {
  activeTraces: number;
  concludedTraces: number;
  totalStepsGenerated: number;
  totalStepsDiscarded: number;
  avgExplorationDepth: number;
} {
  const traces = [...activeTraces.values()];
  const active = traces.filter(t => t.status === 'active').length;
  const concluded = traces.filter(t => t.status === 'concluded').length;
  const totalSteps = traces.reduce((s, t) => s + t.explorationSteps.length, 0);
  const discarded = traces.reduce((s, t) => s + t.explorationSteps.filter(st => st.discarded).length, 0);
  const depths = traces.map(t => {
    const maxD = Math.max(0, ...t.explorationSteps.map(s => s.depth));
    return maxD;
  });
  const avgDepth = depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;

  return {
    activeTraces: active,
    concludedTraces: concluded,
    totalStepsGenerated: totalSteps,
    totalStepsDiscarded: discarded,
    avgExplorationDepth: avgDepth,
  };
}

function enforceTraceCapacity(): void {
  if (activeTraces.size <= MAX_TRACES) return;
  const sorted = [...activeTraces.entries()]
    .sort((a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime());
  const removeCount = activeTraces.size - MAX_TRACES;
  for (let i = 0; i < removeCount; i++) {
    activeTraces.delete(sorted[i]![0]);
  }
}
