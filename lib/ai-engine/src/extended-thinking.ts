/**
 * Extended Thinking with Budget Allocation
 *
 * Hard problems get a dedicated "deep reasoning" pass with configurable token budgets.
 * Wraps high-complexity queries in a multi-pass thinking chain:
 *   Pass 1: Generate reasoning traces (diverge — explore the problem space)
 *   Pass 2: Critique and refine (converge — challenge assumptions, spot gaps)
 *   Pass 3: Synthesize the answer (produce — clean, calibrated final output)
 *
 * Uses the inner monologue infrastructure as the foundation and integrates with
 * the cognitive workspace's shared scratchpad.
 */

import type { HFChatMessage } from './providers/hf-client.js';

export interface ThinkingBudget {
  reasoningTokens: number;
  critiqueTokens: number;
  synthesisTokens: number;
  totalTokens: number;
}

export interface ThinkingPass {
  passId: string;
  passType: 'reasoning' | 'critique' | 'synthesis';
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  content: string;
  confidence: number;
}

export interface ExtendedThinkingResult {
  sessionId: string;
  originalQuery: string;
  passes: ThinkingPass[];
  reasoningTrace: string;
  critiqueNotes: string;
  finalAnswer: string;
  totalTokensUsed: number;
  totalLatencyMs: number;
  confidenceScore: number;
  budgetUsed: ThinkingBudget;
}

export interface ExtendedThinkingOptions {
  laneSlug?: string;
  tenantId?: number | string;
  maxTotalTokens?: number;
  reasoningRatio?: number;
  critiqueRatio?: number;
  synthesisRatio?: number;
  skipCritique?: boolean;
}

type LlmCaller = (messages: HFChatMessage[], maxTokens: number, model?: string) => Promise<{ content: string; inputTokens: number; outputTokens: number; latencyMs: number }>;

const DEFAULT_BUDGET_TOKENS = 8_000;
const DEFAULT_REASONING_RATIO = 0.45;
const DEFAULT_CRITIQUE_RATIO = 0.25;
const DEFAULT_SYNTHESIS_RATIO = 0.30;

let _llmCaller: LlmCaller | null = null;

export function setExtendedThinkingLlmCaller(fn: LlmCaller): void {
  _llmCaller = fn;
}

function allocateBudget(options: ExtendedThinkingOptions): ThinkingBudget {
  const total = options.maxTotalTokens ?? DEFAULT_BUDGET_TOKENS;
  const rRatio = options.reasoningRatio ?? DEFAULT_REASONING_RATIO;
  const cRatio = options.critiqueRatio ?? DEFAULT_CRITIQUE_RATIO;
  const sRatio = options.synthesisRatio ?? DEFAULT_SYNTHESIS_RATIO;

  const normalizer = rRatio + cRatio + sRatio;
  return {
    reasoningTokens: Math.floor(total * (rRatio / normalizer)),
    critiqueTokens: Math.floor(total * (cRatio / normalizer)),
    synthesisTokens: Math.floor(total * (sRatio / normalizer)),
    totalTokens: total,
  };
}

function buildReasoningPrompt(query: string, context: string): HFChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are a deep reasoning engine. Your task is to thoroughly explore a problem by generating structured reasoning traces. 
Think step-by-step. Consider multiple angles, surface hidden assumptions, enumerate possible approaches, and identify what you know vs. don't know.
Do NOT produce a final answer yet — only produce reasoning traces. Use headers and structure.`,
    },
    {
      role: 'user',
      content: `## Problem to Reason Through\n${query}\n\n${context ? `## Available Context\n${context}` : ''}`,
    },
  ];
}

function buildCritiquePrompt(
  query: string,
  reasoningTrace: string,
): HFChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are a critical analysis engine. You will review a reasoning trace and identify:
1. Logical gaps or leaps
2. Unstated assumptions that may be wrong
3. Missing perspectives or evidence
4. Overconfident claims that need hedging
5. Internal contradictions

Be rigorous. Your critique improves the final answer's accuracy. Do NOT produce the final answer yet.`,
    },
    {
      role: 'user',
      content: `## Original Query\n${query}\n\n## Reasoning Trace to Critique\n${reasoningTrace}`,
    },
  ];
}

function buildSynthesisPrompt(
  query: string,
  reasoningTrace: string,
  critiqueNotes: string,
): HFChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are a synthesis engine. Using a completed reasoning trace and its critique, produce a clear, calibrated, and actionable final answer.
- Incorporate valid critique points
- Acknowledge residual uncertainty where appropriate
- Be direct and well-structured
- Do not repeat the reasoning process — only state the refined conclusion`,
    },
    {
      role: 'user',
      content: `## Query\n${query}\n\n## Reasoning Trace\n${reasoningTrace}\n\n## Critique Notes\n${critiqueNotes}`,
    },
  ];
}

function estimateConfidence(reasoningTrace: string, critiqueNotes: string, synthesis: string): number {
  const hedgeWords = ['uncertain', 'unclear', 'might', 'possibly', 'may', 'perhaps', 'insufficient', 'limited'];
  const conflictWords = ['contradiction', 'gap', 'assumption', 'missing', 'unknown'];

  const allText = (reasoningTrace + critiqueNotes + synthesis).toLowerCase();
  const hedgeCount = hedgeWords.filter((w) => allText.includes(w)).length;
  const conflictCount = conflictWords.filter((w) => allText.includes(w)).length;

  const baseConfidence = 0.82;
  const penalty = (hedgeCount * 0.02 + conflictCount * 0.03);
  return Math.max(0.4, Math.min(0.98, baseConfidence - penalty));
}

export async function runExtendedThinking(
  query: string,
  context: string,
  options: ExtendedThinkingOptions = {},
  reasoningModel = 'claude-opus-4-7',
  reasoningProvider = 'anthropic',
): Promise<ExtendedThinkingResult> {
  if (!_llmCaller) {
    return buildFallbackResult(query, context, options);
  }

  const sessionId = `xt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const budget = allocateBudget(options);
  const passes: ThinkingPass[] = [];
  let totalTokensUsed = 0;
  const startAll = Date.now();

  const reasoningMessages = buildReasoningPrompt(query, context);
  const r1 = await _llmCaller(reasoningMessages, budget.reasoningTokens, reasoningModel);
  const reasoningPass: ThinkingPass = {
    passId: `${sessionId}_r`,
    passType: 'reasoning',
    model: reasoningModel,
    provider: reasoningProvider,
    inputTokens: r1.inputTokens,
    outputTokens: r1.outputTokens,
    latencyMs: r1.latencyMs,
    content: r1.content,
    confidence: 0.7,
  };
  passes.push(reasoningPass);
  totalTokensUsed += r1.inputTokens + r1.outputTokens;

  let critiqueContent = '';
  if (!options.skipCritique) {
    const critiqueMessages = buildCritiquePrompt(query, r1.content);
    const r2 = await _llmCaller(critiqueMessages, budget.critiqueTokens, reasoningModel);
    const critiquePass: ThinkingPass = {
      passId: `${sessionId}_c`,
      passType: 'critique',
      model: reasoningModel,
      provider: reasoningProvider,
      inputTokens: r2.inputTokens,
      outputTokens: r2.outputTokens,
      latencyMs: r2.latencyMs,
      content: r2.content,
      confidence: 0.75,
    };
    passes.push(critiquePass);
    critiqueContent = r2.content;
    totalTokensUsed += r2.inputTokens + r2.outputTokens;
  }

  const synthesisMessages = buildSynthesisPrompt(query, r1.content, critiqueContent);
  const r3 = await _llmCaller(synthesisMessages, budget.synthesisTokens, reasoningModel);
  const synthesisPass: ThinkingPass = {
    passId: `${sessionId}_s`,
    passType: 'synthesis',
    model: reasoningModel,
    provider: reasoningProvider,
    inputTokens: r3.inputTokens,
    outputTokens: r3.outputTokens,
    latencyMs: r3.latencyMs,
    content: r3.content,
    confidence: 0.85,
  };
  passes.push(synthesisPass);
  totalTokensUsed += r3.inputTokens + r3.outputTokens;

  const confidenceScore = estimateConfidence(r1.content, critiqueContent, r3.content);

  return {
    sessionId,
    originalQuery: query,
    passes,
    reasoningTrace: r1.content,
    critiqueNotes: critiqueContent,
    finalAnswer: r3.content,
    totalTokensUsed,
    totalLatencyMs: Date.now() - startAll,
    confidenceScore,
    budgetUsed: budget,
  };
}

function buildFallbackResult(
  query: string,
  _context: string,
  options: ExtendedThinkingOptions,
): ExtendedThinkingResult {
  const sessionId = `xt_fallback_${Date.now()}`;
  const budget = allocateBudget(options);
  return {
    sessionId,
    originalQuery: query,
    passes: [],
    reasoningTrace: '[Extended thinking unavailable — LLM caller not registered]',
    critiqueNotes: '',
    finalAnswer: `Extended thinking could not be performed for: ${query.slice(0, 200)}`,
    totalTokensUsed: 0,
    totalLatencyMs: 0,
    confidenceScore: 0.3,
    budgetUsed: budget,
  };
}

export const LANE_TOKEN_BUDGETS: Record<string, ThinkingBudget> = {
  critical: allocateBudget({ maxTotalTokens: 16_000 }),
  high: allocateBudget({ maxTotalTokens: 8_000 }),
  medium: allocateBudget({ maxTotalTokens: 4_000 }),
  low: allocateBudget({ maxTotalTokens: 2_000, skipCritique: true }),
};

export function getBudgetForStakes(stakesLevel: 'low' | 'medium' | 'high' | 'critical'): ThinkingBudget {
  return LANE_TOKEN_BUDGETS[stakesLevel] ?? LANE_TOKEN_BUDGETS['medium']!;
}
