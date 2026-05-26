/**
 * A11oy AMI Formula — TypeScript port of A11OY_AMI_FORMULA_PAYLOAD v1.0
 *
 *   AMI_v2 = (Λ^0.22 · K^0.16 · W^0.16 · T^0.14 · M^0.14 · E^0.10 · P^0.08)
 *            · e^(-0.7N - 0.5D) · G
 *
 * Treats A11oy as a meshing intelligence layer (not a replacement) and gates
 * each agent turn into one of five permission tiers:
 *
 *   BLOCK · WATCH · ASSIST · OPERATE · AUTONOMOUS
 *
 * Used per-turn by the unified A11oy chat to pick a mode/model AND decide
 * how much autonomy this turn is allowed. Pure, deterministic, replayable.
 */

import { computeLambda } from '@szl-holdings/lambda-math';

export type AmiGate = 'BLOCK' | 'WATCH' | 'ASSIST' | 'OPERATE' | 'AUTONOMOUS';

export const PERMISSION_GATES: Record<AmiGate, string[]> = {
  BLOCK: ['observe', 'explain', 'recommend'],
  WATCH: ['observe', 'draft', 'ask_approval'],
  ASSIST: ['observe', 'draft', 'run_safe_tests', 'ask_approval'],
  OPERATE: ['observe', 'draft', 'run_tests', 'open_pr', 'human_approval_required'],
  AUTONOMOUS: ['observe', 'draft', 'run_tests', 'open_pr', 'low_risk_execute_if_policy_allows'],
};

/**
 * AMI v2 coefficient table expressed as Egyptian-fraction strings so the
 * canonical Λ-operator (`@szl-holdings/lambda-math`) parses them as exact
 * rationals. Each entry's numeric value matches the v1.0 payload:
 *
 *   lambda                = 11/50  = 1/5 + 1/50           = 0.22
 *   khipu_topology        = 4/25   = 1/10 + 1/20 + 1/100  = 0.16
 *   witness_density       = 4/25   = 1/10 + 1/20 + 1/100  = 0.16
 *   tool_readiness        = 7/50   = 1/10 + 1/25          = 0.14
 *   mesh_compatibility    = 7/50   = 1/10 + 1/25          = 0.14
 *   evidence_quality      = 1/10                          = 0.10
 *   performance_reliability = 2/25 = 1/15 + 1/75          = 0.08
 *
 * Σ = 1 by construction.
 */
export const AMI_WEIGHTS_EGYPTIAN = {
  lambda: '1/5+1/50',
  khipu_topology: '1/10+1/20+1/100',
  witness_density: '1/10+1/20+1/100',
  tool_readiness: '1/10+1/25',
  mesh_compatibility: '1/10+1/25',
  evidence_quality: '1/10',
  performance_reliability: '1/15+1/75',
} as const;

/**
 * Numeric mirror of {@link AMI_WEIGHTS_EGYPTIAN}, retained for callers that
 * surface weights for display or metrics. The canonical Λ computation uses
 * the Egyptian-fraction table; this view must stay in lockstep.
 */
export const AMI_WEIGHTS = {
  lambda: 0.22,
  khipu_topology: 0.16,
  witness_density: 0.16,
  tool_readiness: 0.14,
  mesh_compatibility: 0.14,
  evidence_quality: 0.10,
  performance_reliability: 0.08,
} as const;

const clamp = (x: number) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));

export interface LutarAxesAMI {
  cleanliness: number;
  horizon: number;
  resonance: number;
  reconciliation: number;
}

export function lutarLambda(a: LutarAxesAMI): number {
  return Number(
    (clamp(a.cleanliness) * clamp(a.horizon) * clamp(a.resonance) * clamp(a.reconciliation)).toFixed(8),
  );
}

export interface OuroborosState {
  cleanliness: number;
  horizon: number;
  resonance: number;
  reconciliation: number;
  noise: number;
  witness: number;
}

export function ouroborosRenew(state: Partial<OuroborosState>): OuroborosState {
  const c = clamp(state.cleanliness ?? 0.5);
  const h = clamp(state.horizon ?? 0.5);
  const r = clamp(state.resonance ?? 0.5);
  const f = clamp(state.reconciliation ?? 0.5);
  const n = clamp(state.noise ?? 0.1);
  const w = clamp(state.witness ?? 0.5);
  const correction = 0.17 * w * r * f;
  return {
    cleanliness: round6(clamp(c + correction - 0.03 * n)),
    horizon: round6(clamp(h + 0.55 * correction)),
    resonance: round6(clamp(r + 0.40 * correction - 0.015 * n)),
    reconciliation: round6(clamp(f + 0.50 * correction)),
    noise: round6(clamp(n * 0.86 - 0.10 * correction)),
    witness: round6(w),
  };
}

export interface AmiInput {
  lambda: number;
  K: number; // khipu topology
  W: number; // witness density
  T: number; // tool readiness
  M: number; // mesh compatibility
  E: number; // evidence quality
  P: number; // performance reliability
  N: number; // noise
  D: number; // drift
  G: number; // governance gate
}

export function amiFormula(i: AmiInput): number {
  const axisScores: Record<keyof typeof AMI_WEIGHTS_EGYPTIAN, number> = {
    lambda: clamp(i.lambda),
    khipu_topology: clamp(i.K),
    witness_density: clamp(i.W),
    tool_readiness: clamp(i.T),
    mesh_compatibility: clamp(i.M),
    evidence_quality: clamp(i.E),
    performance_reliability: clamp(i.P),
  };
  // Canonical Λ — weighted geometric mean over the seven AMI axes with
  // Egyptian-fraction weights. Σ weights = 1, so the Λ result is the raw
  // geometric mean; the envelope `e^(-0.7N - 0.5D) · G` is applied after.
  // To preserve the legacy `Math.max(1e-9, val)` floor that kept a single
  // zero axis from collapsing the whole score, clamp scores up to 1e-9
  // before handing them to computeLambda (which would otherwise zero-pin
  // the composite under axiom A2).
  const components = (Object.keys(AMI_WEIGHTS_EGYPTIAN) as Array<keyof typeof AMI_WEIGHTS_EGYPTIAN>).map((key) => ({
    name: key,
    weight: AMI_WEIGHTS_EGYPTIAN[key],
    score: Math.max(1e-9, axisScores[key]),
  }));
  const { lambda: product } = computeLambda({ components });
  const score = product * Math.exp(-0.7 * clamp(i.N) - 0.5 * clamp(i.D)) * clamp(i.G);
  return Number(score.toFixed(8));
}

export function amiGate(score: number, noise: number, contradictions: number, tests: number, knots: number): AmiGate {
  if (knots < 10 || score < 0.35 || noise > 0.72) return 'BLOCK';
  if (score < 0.58 || contradictions > Math.max(5, tests * 2)) return 'WATCH';
  if (score < 0.76) return 'ASSIST';
  if (score < 0.90) return 'OPERATE';
  return 'AUTONOMOUS';
}

export function governanceGate(contradictions: number, tests: number, W: number, T: number): number {
  if (contradictions > Math.max(3, tests)) return 0.45;
  if (W < 0.35 || T < 0.25) return 0.60;
  return 1.0;
}

/**
 * Lightweight per-turn AMI evaluator for the unified chat.
 * Inputs are coarse signals already available at chat-time:
 *
 *   - mirrorEvalScore: from runMirrorEval (0..1)
 *   - pceAllowed: PCE gate result (true if not blocked)
 *   - hasGovernance: covenant/PCE contract was issued
 *   - toolsAvailable: count of tools wired & healthy
 *   - toolsInvoked: count of tools the planner intends to call this turn
 *   - userPromptLength: chars
 *   - knownContradictions: open issues / failing tests near the topic
 *   - testCoverage: 0..1 platform-wide coverage signal
 *   - alignment: 0..1 task-vs-recommendation alignment score
 *   - knotCount: evidence knots gathered (mirror score → ~50 by default)
 */
export interface ChatAmiSignals {
  mirrorEvalScore: number;
  pceAllowed: boolean;
  hasGovernance: boolean;
  toolsAvailable: number;
  toolsInvoked: number;
  userPromptLength: number;
  knownContradictions: number;
  testCoverage: number;
  alignment: number;
  knotCount?: number;
}

export interface ChatAmiResult {
  formula: string;
  amiScore: number;
  gate: AmiGate;
  permissions: string[];
  components: {
    lambda: number;
    K_khipu_topology: number;
    W_witness_density: number;
    T_tool_readiness: number;
    M_mesh_compatibility: number;
    E_evidence_quality: number;
    P_performance_reliability: number;
    N_noise: number;
    D_drift: number;
    G_governance: number;
  };
  lutarAxes: LutarAxesAMI;
  ouroboros: OuroborosState;
  rationale: string;
}

export function evaluateChatAmi(s: ChatAmiSignals): ChatAmiResult {
  const knots = s.knotCount ?? 50;
  const tests = Math.round(s.testCoverage * 100);
  const contradictions = Math.max(0, Math.round(s.knownContradictions));

  const W = clamp(s.mirrorEvalScore);
  const T = clamp(s.toolsAvailable === 0 ? 0 : s.toolsInvoked / Math.max(1, s.toolsAvailable) * 0.5 + 0.5);
  const M = clamp(0.55 + (s.toolsAvailable > 0 ? 0.35 : 0)); // mesh compatibility — A11oy meshes by design
  const E = clamp(0.55 * s.mirrorEvalScore + 0.45 * s.testCoverage);
  const P = clamp(s.testCoverage);
  const K = clamp(0.4 + Math.min(0.5, Math.log1p(s.toolsAvailable) / Math.log1p(20)));
  const D = clamp(1.0 - s.alignment);
  const N = clamp(0.35 * (1 - W) + 0.25 * (1 - s.alignment) + 0.20 * (1 - W) + 0.20 * (1 - T));

  const cleanliness = clamp(1.0 - N);
  const horizon = clamp(0.40 * 0.7 + 0.30 * T + 0.30 * s.alignment);
  const resonance = clamp(0.35 * (s.pceAllowed ? 1 : 0) + 0.30 * K + 0.20 * M + 0.15 * E);
  const reconciliation = clamp(0.45 * (s.pceAllowed ? 1 : 0) + 0.30 * W + 0.25 * (s.testCoverage));
  const lutarAxes: LutarAxesAMI = { cleanliness, horizon, resonance, reconciliation };
  const lambda = lutarLambda(lutarAxes);

  const renewed = ouroborosRenew({
    cleanliness, horizon, resonance, reconciliation,
    noise: N, witness: W,
  });

  const G = s.hasGovernance ? governanceGate(contradictions, tests, W, T) : 0.7;
  const amiScore = amiFormula({ lambda, K, W, T, M, E, P, N: renewed.noise, D, G });
  const gate = amiGate(amiScore, renewed.noise, contradictions, tests, knots);

  const reasons: string[] = [];
  if (W < 0.6) reasons.push(`witness density ${W.toFixed(2)} below 0.60`);
  if (T < 0.6) reasons.push(`tool readiness ${T.toFixed(2)} below 0.60`);
  if (D > 0.4) reasons.push(`drift ${D.toFixed(2)} above 0.40`);
  if (renewed.noise > 0.3) reasons.push(`noise ${renewed.noise.toFixed(2)} above 0.30`);
  if (!s.pceAllowed) reasons.push('PCE gate did not allow autonomy');
  const rationale = reasons.length === 0
    ? `AMI ${amiScore.toFixed(3)} → ${gate}: all axes healthy, full autonomy within policy.`
    : `AMI ${amiScore.toFixed(3)} → ${gate}: ${reasons.join('; ')}.`;

  return {
    formula: 'AMI_v2 = (Λ^0.22·K^0.16·W^0.16·T^0.14·M^0.14·E^0.10·P^0.08) · e^(-0.7N-0.5D) · G',
    amiScore,
    gate,
    permissions: PERMISSION_GATES[gate],
    components: {
      lambda,
      K_khipu_topology: round6(K),
      W_witness_density: round6(W),
      T_tool_readiness: round6(T),
      M_mesh_compatibility: round6(M),
      E_evidence_quality: round6(E),
      P_performance_reliability: round6(P),
      N_noise: round6(renewed.noise),
      D_drift: round6(D),
      G_governance: round6(G),
    },
    lutarAxes,
    ouroboros: renewed,
    rationale,
  };
}

function round6(x: number): number {
  return Math.round(x * 1_000_000) / 1_000_000;
}

/**
 * Named formula registry — backs the `formula.lookup` tool the unified chat
 * exposes. Adding a formula here makes it discoverable via /api/a11oy/chat/formulas.
 */
export const FORMULA_REGISTRY = {
  'ami_v2': {
    id: 'ami_v2',
    name: 'A11oy Meshing Intelligence (AMI v2)',
    expression: 'AMI_v2 = (Λ^0.22·K^0.16·W^0.16·T^0.14·M^0.14·E^0.10·P^0.08) · e^(-0.7N-0.5D) · G',
    purpose: 'Per-turn agent autonomy gate (BLOCK/WATCH/ASSIST/OPERATE/AUTONOMOUS).',
    inputs: ['lambda', 'K', 'W', 'T', 'M', 'E', 'P', 'N', 'D', 'G'],
    output: 'score in [0,1] mapped to one of five permission gates',
    source: 'attached_assets/A11OY_AMI_FORMULA_PAYLOAD_V1',
  },
  'lutar_lambda': {
    id: 'lutar_lambda',
    name: 'Lutar Lambda — 4-axis composite',
    expression: 'Λ = clamp(cleanliness · horizon · resonance · reconciliation)',
    purpose: 'Multiplicative trust composite that punishes any failed axis.',
    inputs: ['cleanliness', 'horizon', 'resonance', 'reconciliation'],
    output: 'lambda in [0,1]',
    source: 'A11oy AMI payload + @workspace/ouroboros-invariant',
  },
  'ouroboros_renew': {
    id: 'ouroboros_renew',
    name: 'Ouroboros renewal — bounded loop step',
    expression: 'state\' = renew(state, witness, resonance, reconciliation, noise)',
    purpose: 'Single bounded-renewal step on the 6-axis chat-state vector.',
    inputs: ['cleanliness', 'horizon', 'resonance', 'reconciliation', 'noise', 'witness'],
    output: 'next state on the same axes',
    source: 'A11oy AMI payload',
  },
} as const;

export type FormulaId = keyof typeof FORMULA_REGISTRY;
