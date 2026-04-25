/**
 * @workspace/eval-os
 *
 * Eval-OS — Domain-Jury Evaluator Pipeline
 *
 * Scores every consequential recommendation on five dimensions:
 *   1. Grounding         (0–1) — Claims backed by tool-call evidence
 *   2. Actionability     (0–1) — Operator can act on it
 *   3. Policy Compliance (0–1) — Policy gate verdict
 *   4. Reversibility     (0–1) — Action can be undone
 *   5. Confidence        (0–1) — System confidence calibration
 *
 * Usage:
 *   import { scoreRecommendation } from "@workspace/eval-os";
 *   const scores = await scoreRecommendation({ recommendationId, toolCalls, ... });
 */

export * from './jury.js';
export * from './scorer.js';
export * from './store.js';

export const EVAL_OS_VERSION = '1.0.0' as const;
