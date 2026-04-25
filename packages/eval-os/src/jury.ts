/**
 * @workspace/eval-os — Domain-Jury Evaluator
 *
 * The domain-jury is a pipeline that scores every consequential recommendation
 * on five dimensions before it is returned to the caller or stored.
 *
 * Dimensions (see scorer.ts for weights):
 *   1. Grounding         — Claims backed by tool-call evidence
 *   2. Actionability     — Operator can act on it
 *   3. Policy Compliance — Policy gate verdict
 *   4. Reversibility     — Action can be undone
 *   5. Confidence        — System confidence calibration
 *
 * Scores are persisted to the JuryStore for later audit.
 */
import { randomUUID } from 'node:crypto';
import type { DimensionScores } from './scorer.js';
import {
  computeComposite,
  scoreActionability,
  scoreConfidence,
  scoreGrounding,
  scorePolicyCompliance,
  scoreReversibility,
} from './scorer.js';
import { defaultJuryStore, type JuryRecord } from './store.js';

// ─── Jury input ───────────────────────────────────────────────────────────────

export interface JuryToolCallSummary {
  toolId: string;
  toolName: string;
  specialistRole: string;
  success: boolean;
  latencyMs: number;
}

export interface JuryInput {
  /** The recommendation being scored. */
  recommendationId: string;
  title?: string;
  summary?: string;
  reasoning?: string;
  domain?: string;
  /** Tool calls recorded during the run. */
  toolCalls?: JuryToolCallSummary[];
  /** Policy gate verdict from the policy-evaluator specialist. */
  policyVerdict?: 'allowed' | 'requires-approval' | 'blocked';
  /** Autonomy mode used for the run. */
  autonomyMode?: string;
  /** Raw confidence value passed by the coordinator (0–1). */
  confidence?: number;
}

// ─── Jury output ──────────────────────────────────────────────────────────────

export interface JuryVerdict extends DimensionScores {
  /** UUID for this jury run. */
  juryId: string;
  /** The recommendation this verdict is attached to. */
  recommendationId: string;
  /** True when composite >= 0.5. */
  passed: boolean;
  /** ISO timestamp of when the jury ran. */
  evaluatedAt: string;
}

// ─── Main jury function ───────────────────────────────────────────────────────

/**
 * Score a recommendation across all five jury dimensions and persist the
 * verdict to the JuryStore.
 *
 * @example
 * const scores = await scoreRecommendation({ recommendationId, toolCalls, ... });
 * // scores.composite >= 0.5 → recommendation passes
 */
export async function scoreRecommendation(input: JuryInput): Promise<JuryVerdict> {
  const grounding = scoreGrounding(input);
  const actionability = scoreActionability(input);
  const policyCompliance = scorePolicyCompliance(input);
  const reversibility = scoreReversibility(input);
  const confidence = scoreConfidence(input);
  const composite = computeComposite({ grounding, actionability, policyCompliance, reversibility, confidence });

  const verdict: JuryVerdict = {
    juryId: randomUUID(),
    recommendationId: input.recommendationId,
    grounding,
    actionability,
    policyCompliance,
    reversibility,
    confidence,
    composite,
    passed: composite >= 0.5,
    evaluatedAt: new Date().toISOString(),
  };

  const record: JuryRecord = {
    ...verdict,
    domain: input.domain ?? 'general',
    title: input.title,
    summary: input.summary,
  };

  defaultJuryStore.save(record);

  return verdict;
}
