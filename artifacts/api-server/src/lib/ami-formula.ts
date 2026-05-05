/**
 * A11oy AMI (Adaptive Meshing Intelligence) v2 formula.
 *
 * Ported from Stephen Lutar Jr.'s `A11OY_AMI_FORMULA_PAYLOAD_V1` (Python).
 * Used by the Sentra Predictive Defense Cortex to convert per-path evidence
 * into a real composite score + governance gate.
 *
 *   AMI_v2 = (Λ^0.22 · K^0.16 · W^0.16 · T^0.14 · M^0.14 · E^0.10 · P^0.08)
 *            · e^(-0.7N - 0.5D) · G
 *
 * Λ is the Lutar invariant (geometric mean of cleanliness · horizon ·
 * resonance · reconciliation). K = khipu topology, W = witness density,
 * T = tool readiness, M = mesh compatibility, E = evidence quality,
 * P = performance reliability. N is noise penalty, D is drift penalty,
 * G is the binary governance gate.
 *
 * The five-tier output (BLOCK | WATCH | ASSIST | OPERATE | AUTONOMOUS)
 * gates downstream actions; for cortex countermoves it maps onto risk
 * tiers R4 → R3 → R3 → R3 → R2 respectively.
 */

import {
  evaluateRiskTier,
  type RiskTier,
  type RiskTierDecision,
} from '@workspace/ouroboros';

const WEIGHTS = {
  lambda: 0.22,
  khipu_topology: 0.16,
  witness_density: 0.16,
  tool_readiness: 0.14,
  mesh_compatibility: 0.14,
  evidence_quality: 0.1,
  performance_reliability: 0.08,
} as const;

export type AmiGate = 'BLOCK' | 'WATCH' | 'ASSIST' | 'OPERATE' | 'AUTONOMOUS';

export interface AmiAxes {
  readonly lambda: number;
  readonly khipu_topology: number;
  readonly witness_density: number;
  readonly tool_readiness: number;
  readonly mesh_compatibility: number;
  readonly evidence_quality: number;
  readonly performance_reliability: number;
}

export interface AmiPenalties {
  readonly noise: number;
  readonly drift: number;
  readonly governance_pass: boolean;
}

export interface AmiResult {
  readonly score: number;
  readonly composite_0_100: number;
  readonly gate: AmiGate;
  readonly risk_tier: RiskTier;
  readonly axes: AmiAxes;
  readonly penalties: AmiPenalties;
  readonly formula: string;
  readonly governance_decision: RiskTierDecision;
}

const FORMULA = 'AMI_v2 = Λ^0.22·K^0.16·W^0.16·T^0.14·M^0.14·E^0.10·P^0.08 · e^(-0.7N - 0.5D) · G';

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

/** Λ = C·H·R·F (zero-pinning preserved). */
export function lutarLambda(
  cleanliness: number,
  horizon: number,
  resonance: number,
  reconciliation: number,
): number {
  const c = clamp01(cleanliness);
  const h = clamp01(horizon);
  const r = clamp01(resonance);
  const f = clamp01(reconciliation);
  if (c === 0 || h === 0 || r === 0 || f === 0) return 0;
  return c * h * r * f;
}

function gateFromScore(score: number, governancePass: boolean): AmiGate {
  if (!governancePass) return 'BLOCK';
  if (score < 0.2) return 'BLOCK';
  if (score < 0.4) return 'WATCH';
  if (score < 0.6) return 'ASSIST';
  if (score < 0.8) return 'OPERATE';
  return 'AUTONOMOUS';
}

const GATE_TO_RISK_TIER: Readonly<Record<AmiGate, RiskTier>> = Object.freeze({
  BLOCK: 'R4_critical',
  WATCH: 'R3_high',
  ASSIST: 'R3_high',
  OPERATE: 'R3_high',
  AUTONOMOUS: 'R2_moderate',
});

/**
 * Compute the AMI v2 score and resolve the governance gate + risk tier.
 *
 * The function is pure: same axes + penalties → same output. This makes
 * cortex predictions deterministically replayable for proof-chain audit.
 */
export function computeAmi(axes: AmiAxes, penalties: AmiPenalties): AmiResult {
  const cleaned: AmiAxes = {
    lambda: clamp01(axes.lambda),
    khipu_topology: clamp01(axes.khipu_topology),
    witness_density: clamp01(axes.witness_density),
    tool_readiness: clamp01(axes.tool_readiness),
    mesh_compatibility: clamp01(axes.mesh_compatibility),
    evidence_quality: clamp01(axes.evidence_quality),
    performance_reliability: clamp01(axes.performance_reliability),
  };
  const N = clamp01(penalties.noise);
  const D = clamp01(penalties.drift);
  const G = penalties.governance_pass ? 1 : 0;

  let product = 1;
  for (const key of Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>) {
    const v = Math.max(1e-9, cleaned[key]);
    product *= Math.pow(v, WEIGHTS[key]);
  }
  const score = product * Math.exp(-0.7 * N - 0.5 * D) * G;
  const rounded = Math.round(score * 1e8) / 1e8;
  const gate = gateFromScore(rounded, penalties.governance_pass);
  const riskTier = GATE_TO_RISK_TIER[gate];
  const governanceDecision = evaluateRiskTier({
    tier: riskTier,
    operatorMode: 'approval_gated',
  });

  return {
    score: rounded,
    composite_0_100: Math.round(rounded * 100),
    gate,
    risk_tier: riskTier,
    axes: cleaned,
    penalties: { noise: N, drift: D, governance_pass: penalties.governance_pass },
    formula: FORMULA,
    governance_decision: governanceDecision,
  };
}

/**
 * Derive AMI axes from a cortex attack-path prediction. The mapping turns
 * the path's likelihood / impact / time-to-exploit and surrounding
 * intercept context into the seven AMI axes deterministically.
 */
export interface CortexPathInput {
  readonly likelihood: number;
  readonly impact: number;
  readonly time_to_exploit_hours: number;
  readonly twin_fidelity_pct: number;
  readonly covenant_gates_passed: number;
  readonly covenant_gates_blocked: number;
  readonly active_intercepts_blocked_pct: number;
  readonly horizon_hours: number;
  readonly contradictions: number;
}

export function deriveCortexAmi(input: CortexPathInput): AmiResult {
  const cleanliness = clamp01(1 - input.likelihood); // adversary's likelihood lowers cleanliness
  const horizon = clamp01(Math.min(1, input.time_to_exploit_hours / input.horizon_hours));
  const resonance = clamp01(input.twin_fidelity_pct / 100);
  const totalGates = input.covenant_gates_passed + input.covenant_gates_blocked;
  const reconciliation =
    totalGates > 0 ? clamp01(input.covenant_gates_passed / totalGates) : 0.5;
  const lambda = lutarLambda(cleanliness, horizon, resonance, reconciliation);

  const K = clamp01(input.active_intercepts_blocked_pct);
  const W = clamp01(input.covenant_gates_passed / Math.max(1, totalGates));
  const T = clamp01(1 - input.likelihood * 0.5);
  const M = clamp01(input.twin_fidelity_pct / 100);
  const E = clamp01((W + K) / 2);
  const P = clamp01(1 - input.contradictions * 0.1);
  const N = clamp01(input.impact * (1 - resonance));
  const D = clamp01(input.contradictions * 0.15);
  const governancePass = totalGates === 0 || input.covenant_gates_blocked / totalGates < 0.25;

  return computeAmi(
    {
      lambda,
      khipu_topology: K,
      witness_density: W,
      tool_readiness: T,
      mesh_compatibility: M,
      evidence_quality: E,
      performance_reliability: P,
    },
    { noise: N, drift: D, governance_pass: governancePass },
  );
}
