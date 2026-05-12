/**
 * Primitive 65 — Thinking-mode arbiter
 *
 * Inspired by GLM-4.5/4.6's hybrid reasoning (thinking vs non-thinking
 * mode) and Qwen3-Thinking-2507's seamless mode switch. The
 * architectural insight: not every claim needs a chain of thought —
 * cheap claims should skip reasoning, hard claims must enter it.
 * We lift this into a deterministic arbiter that decides whether a
 * claim must produce a thinking-trace receipt before being admitted.
 */

export type ThinkingMode = "think" | "no-think";

export interface ClaimDescriptor {
  id: string;
  estimatedCostTokens: number;
  difficulty: number; // 0..1, 0 trivial, 1 hard
  hasGroundTruth: boolean;
}

export interface ThinkingPolicy {
  difficultyThreshold: number; // think when difficulty >= threshold
  maxNoThinkCost: number; // force think when token cost exceeds
  forceThinkWithoutGroundTruth: boolean;
}

export interface ThinkingDecision {
  claimId: string;
  mode: ThinkingMode;
  rationale: string;
  policy: ThinkingPolicy;
}

export const defaultThinkingPolicy: ThinkingPolicy = {
  difficultyThreshold: 0.6,
  maxNoThinkCost: 1500,
  forceThinkWithoutGroundTruth: true,
};

export function arbitrateThinking(
  claim: ClaimDescriptor,
  policy: ThinkingPolicy = defaultThinkingPolicy
): ThinkingDecision {
  if (policy.forceThinkWithoutGroundTruth && !claim.hasGroundTruth) {
    return {
      claimId: claim.id,
      mode: "think",
      rationale: "no ground truth — must produce thinking trace",
      policy,
    };
  }
  if (claim.difficulty >= policy.difficultyThreshold) {
    return {
      claimId: claim.id,
      mode: "think",
      rationale: `difficulty ${claim.difficulty} >= threshold ${policy.difficultyThreshold}`,
      policy,
    };
  }
  if (claim.estimatedCostTokens > policy.maxNoThinkCost) {
    return {
      claimId: claim.id,
      mode: "think",
      rationale: `cost ${claim.estimatedCostTokens} > maxNoThinkCost ${policy.maxNoThinkCost}`,
      policy,
    };
  }
  return {
    claimId: claim.id,
    mode: "no-think",
    rationale: "below all thinking-mode triggers",
    policy,
  };
}
