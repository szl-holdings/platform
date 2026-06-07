/**
 * @workspace/eval-os — Dimension Scorers
 *
 * Each function scores one jury dimension in [0, 1].
 * All functions are pure and deterministic (no external I/O).
 */
import type { JuryInput } from './jury.js';

// ─── 1. Grounding ─────────────────────────────────────────────────────────────
//
// Grounding asks: are the claims in this recommendation backed by tool calls
// (evidence) rather than hallucination?  A recommendation with zero successful
// tool calls scores 0.0; one backed by multiple successful calls scores ≥ 0.7.

export function scoreGrounding(input: JuryInput): number {
  const { toolCalls = [] } = input;
  if (toolCalls.length === 0) return 0.2;

  const successCount = toolCalls.filter((t) => t.success).length;
  const ratio = successCount / toolCalls.length;

  // Weight: ratio of success + bonus for diversity of tool types
  const uniqueRoles = new Set(toolCalls.map((t) => t.specialistRole)).size;
  const diversityBonus = Math.min(uniqueRoles * 0.05, 0.2);
  return Math.min(ratio * 0.8 + diversityBonus, 1.0);
}

// ─── 2. Actionability ─────────────────────────────────────────────────────────
//
// Actionability asks: can an operator act on this recommendation?
// Proxied by: does the recommendation have a specific title/summary (not empty),
// and was the planner specialist involved?

export function scoreActionability(input: JuryInput): number {
  const { title, summary, reasoning, toolCalls = [] } = input;

  let score = 0.5;
  if (title && title.length > 10) score += 0.1;
  if (summary && summary.length > 20) score += 0.1;
  if (reasoning && reasoning.length > 20) score += 0.1;

  const hasPlanner = toolCalls.some((t) => t.specialistRole === 'planner' && t.success);
  if (hasPlanner) score += 0.2;

  return Math.min(score, 1.0);
}

// ─── 3. Policy Compliance ─────────────────────────────────────────────────────
//
// Policy compliance asks: did the policy evaluator allow this recommendation?
// Maps policy verdicts to scores.

export function scorePolicyCompliance(input: JuryInput): number {
  const verdict = input.policyVerdict;
  if (!verdict) return 0.5;
  switch (verdict) {
    case 'allowed':
      return 1.0;
    case 'requires-approval':
      return 0.6;
    case 'blocked':
      return 0.0;
    default:
      return 0.5;
  }
}

// ─── 4. Reversibility ────────────────────────────────────────────────────────
//
// Reversibility asks: can this action be undone if it turns out to be wrong?
// Proxied by: autonomy mode (observe/recommend = fully reversible;
// ask-to-act/approved-act = less so) and absence of destructive tool calls.

export function scoreReversibility(input: JuryInput): number {
  const { autonomyMode, toolCalls = [] } = input;
  let base = 0.8;

  switch (autonomyMode) {
    case 'observe':
    case 'recommend':
      base = 0.95;
      break;
    case 'draft':
      base = 0.85;
      break;
    case 'ask-to-act':
      base = 0.75;
      break;
    case 'approved-act':
      base = 0.6;
      break;
  }

  const hasDestructive = toolCalls.some((t) =>
    ['delete', 'drop', 'purge', 'destroy'].some((kw) => t.toolId.includes(kw)),
  );
  if (hasDestructive) base -= 0.3;

  return Math.max(base, 0.0);
}

// ─── 5. Confidence ────────────────────────────────────────────────────────────
//
// Confidence directly uses the recommendation's confidence value,
// adjusted by tool-call success rate.

export function scoreConfidence(input: JuryInput): number {
  const { confidence = 0.7, toolCalls = [] } = input;
  if (toolCalls.length === 0) return confidence * 0.8;

  const successRate = toolCalls.filter((t) => t.success).length / toolCalls.length;
  return Math.min(confidence * (0.5 + successRate * 0.5), 1.0);
}

// ─── Composite ────────────────────────────────────────────────────────────────

export interface DimensionScores {
  grounding: number;
  actionability: number;
  policyCompliance: number;
  reversibility: number;
  confidence: number;
  composite: number;
}

/**
 * Weighted composite score across all five jury dimensions.
 *
 * Weights (sum = 1.0):
 *   grounding:         0.25
 *   actionability:     0.20
 *   policyCompliance:  0.25
 *   reversibility:     0.15
 *   confidence:        0.15
 */
export function computeComposite(scores: Omit<DimensionScores, 'composite'>): number {
  return (
    scores.grounding * 0.25 +
    scores.actionability * 0.2 +
    scores.policyCompliance * 0.25 +
    scores.reversibility * 0.15 +
    scores.confidence * 0.15
  );
}
