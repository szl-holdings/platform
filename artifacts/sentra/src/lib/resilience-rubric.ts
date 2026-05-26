/**
 * Cyber Resilience Rubric — Sentra.
 *
 * Source: Army Cyber Defense Review, Vol 11 No 3 — Dotterrer, "A Resilience
 * Taxonomy for Mission-Centric Cyber Operations" (Synthesis dossier row 11).
 *
 * Promotes the five-stage Dotterrer taxonomy
 *
 *     ANTICIPATE · WITHSTAND · RECOVER · ADAPT · EVOLVE
 *
 * into a typed scoring rubric Sentra's cockpit can grade an estate against.
 * Each stage carries an Egyptian-fraction weight (Σ = 1) and a 0-100 score.
 * The composite is the canonical Λ-operator — the weighted geometric mean
 * `computeLambda` from `@szl-holdings/lambda-math` — applied to stage scores
 * normalised into [0, 1], then scaled back to [0, 100] for badge rendering.
 * Using Λ instead of a local weighted arithmetic mean keeps Sentra in lock-
 * step with every other risk-scoring surface (vessels, counsel, etc.): if
 * the formula needs to change, change it in `packages/lambda-math` and every
 * consumer moves together. A maturity tier is derived from the composite.
 * Stages are intentionally evaluated in the dossier order so the UI always
 * tells the same story top-to-bottom.
 */
import { computeLambda } from '@szl-holdings/lambda-math';

export const RESILIENCE_STAGES = [
  'anticipate',
  'withstand',
  'recover',
  'adapt',
  'evolve',
] as const;

export type ResilienceStage = (typeof RESILIENCE_STAGES)[number];

export interface StageDefinition {
  readonly stage: ResilienceStage;
  readonly label: string;
  readonly weight: number;       // ∑ weights === 1
  /**
   * Egyptian-fraction expression of `weight` — a sum of distinct unit
   * fractions (or a single rational atom) that `computeLambda` parses
   * exactly. Keeping both fields means auditors can reconstruct the
   * weight without trusting an IEEE-754 round-trip.
   */
  readonly weightEgyptian: string;
  readonly description: string;
  readonly evidencePrompts: ReadonlyArray<string>;
}

/**
 * Dotterrer weighting from the CDR essay: ANTICIPATE and WITHSTAND together
 * carry ≈ 50% of the rubric, with the remaining 50% distributed across the
 * three recovery / learning stages.
 *
 * Weights in Egyptian-fraction form (each is a sum of distinct unit
 * fractions, so the rubric's audit story is `decomposeUnitFraction`-style
 * inspectable):
 *
 *     anticipate = 1/4               (= 5/20)
 *     withstand  = 1/4               (= 5/20)
 *     recover    = 1/5               (= 4/20)
 *     adapt      = 1/10 + 1/20       (= 3/20)
 *     evolve     = 1/10 + 1/20       (= 3/20)
 *     —————————————————————————————
 *     Σ          = 20/20 = 1
 */
export const RESILIENCE_RUBRIC: ReadonlyArray<StageDefinition> = Object.freeze([
  Object.freeze({
    stage: 'anticipate',
    label: 'Anticipate',
    weight: 0.25,
    weightEgyptian: '1/4',
    description:
      'Threat-informed posture: continuous intel, attack-surface mapping, and pre-positioned playbooks.',
    evidencePrompts: Object.freeze([
      'Are crown-jewel assets enumerated and tiered?',
      'Is adversary-emulation coverage current within 30 days?',
      'Are pre-approved containment playbooks attached to each tier-1 asset?',
    ]),
  }),
  Object.freeze({
    stage: 'withstand',
    label: 'Withstand',
    weight: 0.25,
    weightEgyptian: '1/4',
    description:
      'Continue mission delivery while under active compromise: segmentation, hardening, and graceful degradation.',
    evidencePrompts: Object.freeze([
      'Are tier-1 services demonstrably reachable under a red-team blast?',
      'Is least-privilege enforced for all human and non-human identities?',
      'Are degraded-mode SLAs published and rehearsed?',
    ]),
  }),
  Object.freeze({
    stage: 'recover',
    label: 'Recover',
    weight: 0.2,
    weightEgyptian: '1/5',
    description:
      'Restore trusted state from verified clean backups within target RTO/RPO; certify the recovered surface.',
    evidencePrompts: Object.freeze([
      'Is the last successful clean-room restore within the published RTO?',
      'Are backups integrity-verified and air-gapped from the production identity plane?',
      'Is the recovery certification artifact replay-anchored?',
    ]),
  }),
  Object.freeze({
    stage: 'adapt',
    label: 'Adapt',
    weight: 0.15,
    weightEgyptian: '1/10+1/20',
    description:
      'Close the loop: ingest incident telemetry into controls, detections, and runbooks before the next event.',
    evidencePrompts: Object.freeze([
      'Are post-incident actions tracked to closure with named owners?',
      'Has the detection library been updated against the most recent intrusion set?',
      'Are simulation-theater scenarios refreshed quarterly?',
    ]),
  }),
  Object.freeze({
    stage: 'evolve',
    label: 'Evolve',
    weight: 0.15,
    weightEgyptian: '1/10+1/20',
    description:
      'Reshape the doctrine: re-baseline tolerances, retire brittle controls, invest in step-change capabilities.',
    evidencePrompts: Object.freeze([
      'Has the rubric weighting been reviewed against current mission impact?',
      'Are step-change investments (zero-trust, deception, post-quantum) on a funded roadmap?',
      'Is the resilience program externally reviewed within 12 months?',
    ]),
  }),
]);

// Self-check: weights sum to 1 (within FP tolerance). Caught at module load.
{
  const total = RESILIENCE_RUBRIC.reduce((s, r) => s + r.weight, 0);
  if (Math.abs(total - 1) > 1e-9) {
    throw new Error(
      `resilience-rubric: stage weights sum to ${total}, expected 1`,
    );
  }
}

export type StageScores = Readonly<Record<ResilienceStage, number>>;

export type MaturityTier =
  | 'initial'
  | 'developing'
  | 'defined'
  | 'managed'
  | 'optimising';

export interface ResilienceAssessment {
  readonly compositeScore: number;        // 0..100
  readonly tier: MaturityTier;
  readonly stageScores: StageScores;
  readonly weakestStage: ResilienceStage;
  readonly strongestStage: ResilienceStage;
  readonly recommendations: ReadonlyArray<{
    readonly stage: ResilienceStage;
    readonly prompt: string;
  }>;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function maturityFromScore(score: number): MaturityTier {
  if (score >= 85) return 'optimising';
  if (score >= 70) return 'managed';
  if (score >= 55) return 'defined';
  if (score >= 35) return 'developing';
  return 'initial';
}

/**
 * Grade an estate against the Dotterrer rubric. Each stage score is clipped
 * to [0, 100] before being normalised to [0, 1] for the canonical Λ-operator
 * (`computeLambda`), so out-of-range inputs cannot move the composite outside
 * the unit interval and a single zero-scored stage zero-pins the rubric
 * (axiom A2 — see `packages/lambda-math/src/lambda.ts`).
 */
export function gradeResilience(scores: StageScores): ResilienceAssessment {
  let weakStage: ResilienceStage = RESILIENCE_RUBRIC[0]!.stage;
  let weakScore = Infinity;
  let strongStage: ResilienceStage = RESILIENCE_RUBRIC[0]!.stage;
  let strongScore = -Infinity;

  const normalised: Record<ResilienceStage, number> = {
    anticipate: 0, withstand: 0, recover: 0, adapt: 0, evolve: 0,
  };

  for (const def of RESILIENCE_RUBRIC) {
    const raw = scores[def.stage];
    const s = clamp(typeof raw === 'number' && Number.isFinite(raw) ? raw : 0, 0, 100);
    normalised[def.stage] = s;
    if (s < weakScore) { weakScore = s; weakStage = def.stage; }
    if (s > strongScore) { strongScore = s; strongStage = def.stage; }
  }

  // Λ over stage scores normalised to [0, 1]; scale the result back to
  // the rubric's 0..100 axis for badge rendering.
  const lambda = computeLambda({
    components: RESILIENCE_RUBRIC.map((def) => ({
      name: def.stage,
      weight: def.weightEgyptian,
      score: normalised[def.stage] / 100,
    })),
  }).lambda;
  const composite = lambda * 100;

  // Recommendation surface: surface the first prompt of every stage scoring
  // below the "defined" maturity threshold so the cockpit always has a
  // concrete next action per weak stage.
  const recommendations: Array<{ stage: ResilienceStage; prompt: string }> = [];
  for (const def of RESILIENCE_RUBRIC) {
    if (normalised[def.stage] < 55) {
      const prompt = def.evidencePrompts[0];
      if (prompt) recommendations.push({ stage: def.stage, prompt });
    }
  }

  const compositeRounded = Math.round(clamp(composite, 0, 100) * 10) / 10;

  return {
    compositeScore: compositeRounded,
    tier: maturityFromScore(compositeRounded),
    stageScores: Object.freeze(normalised),
    weakestStage: weakStage,
    strongestStage: strongStage,
    recommendations: Object.freeze(recommendations),
  };
}
