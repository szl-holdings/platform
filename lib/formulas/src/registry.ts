/**
 * Formula registry — the canonical, thesis-sourced catalog.
 *
 * Every entry in this list maps to:
 *   1. A typed pure function (`impl` field).
 *   2. A thesis section (`provenance.thesisDoc` + `thesisSection`).
 *   3. A semantic version (`version`) — incremented when parameters change
 *      under governance.
 *
 * The A11oy `/formulas` Codex surface reads this registry directly so the
 * UI never drifts from the runtime. The audit document at
 * `docs/audits/formulas.md` is generated from the same source.
 */

export type FormulaDomain =
  | 'governance'
  | 'risk'
  | 'scoring'
  | 'optimization'
  | 'embedding'
  | 'routing'
  | 'evolution'
  | 'invariant'
  | 'physics'
  | 'arbitrage'
  | 'signal-processing';

export interface FormulaProvenance {
  thesisDoc: string;
  thesisSection: string;
  thesisVersion: string;
  firstSeenCommit?: string;
  equation: string;
  intent: string;
  citations?: readonly string[];
}

export interface FormulaParameter {
  name: string;
  description: string;
  default: number;
  /** Inclusive range that the governance UI exposes for tuning. */
  range?: readonly [number, number];
  /** Stable units string (e.g. 'probability', '$', 'tokens'). */
  units?: string;
}

export interface FormulaSpec<I = unknown, O = unknown> {
  /** Stable id (kebab-case). Becomes part of API URLs. */
  id: string;
  name: string;
  domain: FormulaDomain;
  /** Semantic version — bumped on parameter changes. */
  version: string;
  description: string;
  provenance: FormulaProvenance;
  /** Tunable parameters that A11oy may adjust under governance. */
  parameters: readonly FormulaParameter[];
  /** Pure function — never throws on valid input. */
  impl: (input: I) => O;
  /** Inputs/outputs documented for the Codex page. */
  inputShape: string;
  outputShape: string;
  /** Sites in the codebase that consume this formula. Audit aid. */
  consumers: readonly string[];
}

import { lutarInvariant5, defaultWeights5, type LutarAxes5 } from '@workspace/lutar-formulas/lutar';
import { lOmega, OMEGA_MODES, type ModelSpec, type OmegaWeights, type QuerySpec } from '@workspace/lutar-formulas/omega';
import { propeller } from '@workspace/lutar-formulas/propeller';
import { xi as xiCompute, dialogEntropy, sigmoid } from '@workspace/lutar-formulas/xi';
import { proofClosureScore } from './scoring.js';
import { autonomyGate, escalationDelaySeconds } from './governance.js';
import { riskScore, driftScore } from './risk.js';
import { rosieProposalScore } from './evolution.js';

/**
 * The canonical registry. ORDER MATTERS for the UI listing.
 *
 * To add a new formula:
 *   1. Add a section to the next thesis canonical document.
 *   2. Implement the pure function in the appropriate module.
 *   3. Add an entry here with provenance.
 *   4. Update `docs/audits/formulas.md`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FORMULA_REGISTRY: readonly FormulaSpec<any, any>[] = [
  // ─── Invariants ──────────────────────────────────────────────────────
  {
    id: 'lutar-invariant-5',
    name: 'Lutar Invariant Λ₅ (Gauß-closed)',
    domain: 'invariant',
    version: '1.0.0',
    description:
      'Five-axis trust invariant Λ₅ = C^α · H^β · R^γ · F^δ · G^ε with Egyptian-decomposable weights and Gauß closure. Bounded by min(axes).',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§2.5',
      thesisVersion: 'v10',
      equation: 'Λ₅ = C^α · H^β · R^γ · F^δ · G^ε',
      intent:
        'Quantify trust in a piece of evidence across cleanliness, horizon, resonance, frustum, and Gauß-closure axes.',
      citations: ['vendor/ouroboros-py/ouroboros/invariant.py', 'papers/paper-03-lutar-invariant.tex'],
    },
    parameters: [
      { name: 'alpha', description: 'Cleanliness exponent', default: 0.2, range: [0, 1] },
      { name: 'beta', description: 'Horizon exponent', default: 0.2, range: [0, 1] },
      { name: 'gamma', description: 'Resonance exponent', default: 0.2, range: [0, 1] },
      { name: 'delta', description: 'Frustum exponent', default: 0.2, range: [0, 1] },
      { name: 'epsilon', description: 'Gauß-closure exponent', default: 0.2, range: [0, 1] },
    ],
    impl: (axes: LutarAxes5) => lutarInvariant5(axes, defaultWeights5()),
    inputShape: '{ cleanliness, horizon, resonance, frustum, gaussClosure } each in [0,1]',
    outputShape: 'LutarReport5 { invariant, axes, weights, proof }',
    consumers: [
      'artifacts/sentra/src/brain/lib/proof.ts',
      'artifacts/a11oy/src/pages/ProofLedger.tsx',
      'artifacts/api-server/src/routes/ouroboros.ts',
    ],
  },

  // ─── Signal-processing primitives (Lean-formalised) ─────────────────
  {
    id: 'null-space-projection',
    name: 'Null-space projection coexistence',
    domain: 'signal-processing',
    version: '1.0.0',
    description:
      'For a channel map A and a projector P into ker(A), every projected waveform satisfies A(P v) = 0 — the radar/comms coexistence post-condition.',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§3.1 (Connection primitive — null-space coexistence)',
      thesisVersion: 'v10',
      equation: 'A · P = 0   ⇒   ∀v.  A (P v) = 0',
      intent:
        'Make the radar/comms null-space-projection post-condition checkable both numerically (TS shim) and formally (Lean lemma).',
      citations: [
        'Sodagari, Khawar, Clancy, McGwier — A Projection-Based Approach for Radar and Telecommunication Systems Coexistence (IEEE Globecom 2012)',
        'packages/lean-formulas/Connection/NullSpace.lean',
        'packages/agi-forecast/src/null-space.ts',
      ],
    },
    parameters: [],
    impl: ({ Av }: { Av: readonly number[] }) =>
      Av.every((x) => Math.abs(x) < 1e-9),
    inputShape: '{ Av: number[]  // A·(P v) sampled numerically }',
    outputShape: 'boolean (true if post-condition holds within 1e-9)',
    consumers: [
      'packages/agi-forecast/src/null-space.ts',
      'packages/lean-formulas/Connection/NullSpace.lean',
    ],
  },

  // ─── Routing ─────────────────────────────────────────────────────────
  {
    id: 'l-omega-router',
    name: 'L_Ω model router score',
    domain: 'routing',
    version: '1.0.0',
    description:
      'Operational L_Ω = Σ wᵢ Lᵢ over six router signatures (cost-eff, speed, context, capability, batch, geometric).',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§2.7',
      thesisVersion: 'v10',
      equation: 'L_Ω = Σᵢ wᵢ · Lᵢ(model, query),  Σwᵢ = 1',
      intent: 'Pick the model that maximises a tunable trade-off across cost, latency, intelligence, and fit.',
      citations: ['papers/paper-01-lutar-omega-formalism.tex', 'lib/lutar-formulas/src/omega.ts'],
    },
    parameters: Object.entries(OMEGA_MODES.ultra).map(([k, v]) => ({
      name: `w_${k}`,
      description: `Weight for ${k}`,
      default: v,
      range: [0, 1] as const,
    })),
    impl: ({ m, q, w }: { m: ModelSpec; q: QuerySpec; w: OmegaWeights }) => lOmega(m, q, w),
    inputShape: '{ m: ModelSpec, q: QuerySpec, w: OmegaWeights }',
    outputShape: 'number (raw L_Ω score)',
    consumers: [
      'artifacts/api-server/src/lib/model-router.ts',
      'lib/ai-engine/src/router/*',
      'artifacts/a11oy/src/pages/ModelRouter.tsx',
    ],
  },

  {
    id: 'xi-unification',
    name: 'Ξ — Ultra-Routing Unification',
    domain: 'routing',
    version: '1.0.0',
    description: 'Ξ = L_Ω · P_Λ · σ(Ā_lang) · 1/(1 + H_dialog) — unified routing scalar.',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§2.7',
      thesisVersion: 'v10',
      equation: 'Ξ = L_Ω · P_Λ · σ(Ā_lang) / (1 + H_dialog)',
      intent: 'Combine model selection, propeller alignment, language arbitrage, and dialog stability into one score.',
      citations: ['papers/paper-10-ultra-routing-xi-unification.tex'],
    },
    parameters: [],
    impl: ({ lOmega, pLambda, meanALang, history }: { lOmega: number; pLambda: number; meanALang: number; history: { role: string; content: string }[] }) =>
      xiCompute({ lOmega, pLambda, meanALang, history }).xi,
    inputShape: '{ lOmega, pLambda, meanALang, history }',
    outputShape: 'number (Ξ scalar)',
    consumers: ['lib/lutar-formulas/src/router.ts'],
  },

  {
    id: 'propeller-alignment',
    name: 'Propeller P_Λ — Goal-aligned thrust',
    domain: 'optimization',
    version: '1.0.0',
    description: 'P_Λ = ρ_I · A_ω · Δv_L · 2/(1 + v_out/v_in) · cos θ — alignment of an action vector with a goal.',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§2.7',
      thesisVersion: 'v10',
      equation: 'P_Λ = ρ_I · A_ω · Δv_L · 2/(1 + v_out/v_in) · cos θ',
      intent: 'Quantify how well a candidate model/agent step aligns with the operator goal vector.',
      citations: ['papers/paper-09-propeller-sota-routing.tex'],
    },
    parameters: [],
    impl: ({ m, q, omegaIn, omegaOut, goal, step }: { m: ModelSpec; q: QuerySpec; omegaIn: number; omegaOut: number; goal: readonly number[]; step: readonly number[] }) =>
      propeller(m, q, omegaIn, omegaOut, goal, step),
    inputShape: '{ m, q, omegaIn, omegaOut, goal, step }',
    outputShape: '{ P_lambda, thrust, froude, alignment }',
    consumers: ['lib/lutar-formulas/src/router.ts'],
  },

  // ─── Risk ────────────────────────────────────────────────────────────
  {
    id: 'risk-score',
    name: 'Severity-weighted risk score',
    domain: 'risk',
    version: '1.0.0',
    description: 'r = severity · likelihood · valueAtRisk — bounded by configurable cap.',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§5.2',
      thesisVersion: 'v10',
      equation: 'r = clip(severity · likelihood · valueAtRisk, 0, cap)',
      intent: 'Single comparable risk scalar for Sentra signals, Counsel matters, Terra deals.',
      citations: ['docs/observability-standard.md'],
    },
    parameters: [
      { name: 'cap', description: 'Maximum risk (saturation point)', default: 1_000_000, range: [1_000, 1e9], units: '$' },
    ],
    impl: ({ severity, likelihood, valueAtRisk, cap }: { severity: number; likelihood: number; valueAtRisk: number; cap?: number }) =>
      riskScore(severity, likelihood, valueAtRisk, cap),
    inputShape: '{ severity in [0,1], likelihood in [0,1], valueAtRisk: number, cap?: number }',
    outputShape: 'number (risk scalar)',
    consumers: [
      'artifacts/sentra/src/brain/lib/risk.ts',
      'artifacts/counsel/src/lib/matter-risk.ts',
      'artifacts/terra/src/lib/deal-score.ts',
    ],
  },

  {
    id: 'drift-score',
    name: 'Distribution drift score (KL approx)',
    domain: 'risk',
    version: '1.0.0',
    description: 'KL-divergence approximation between two parameter snapshots — used to flag formula drift.',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§5.4',
      thesisVersion: 'v10',
      equation: 'D_KL(p ‖ q) ≈ Σ pᵢ · log(pᵢ / qᵢ)',
      intent: 'Detect when a parameter distribution has shifted enough to warrant ROSIE attention.',
    },
    parameters: [
      { name: 'epsilon', description: 'Numerical floor for log', default: 1e-9, range: [1e-12, 1e-3] },
    ],
    impl: ({ p, q }: { p: readonly number[]; q: readonly number[] }) => driftScore(p, q),
    inputShape: '{ p: number[], q: number[] }  (same length)',
    outputShape: 'number (≥0; 0 means no drift)',
    consumers: ['artifacts/sentra/src/brain/lib/rosie-loop.ts'],
  },

  // ─── Governance ──────────────────────────────────────────────────────
  {
    id: 'autonomy-gate',
    name: 'Autonomy gate decision',
    domain: 'governance',
    version: '1.0.0',
    description:
      'Decides whether a proposed action runs autonomously, requires single approval, or requires multi-party approval.',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§4.3',
      thesisVersion: 'v10',
      equation:
        "gate(r, t, c) = 'auto' if r < t.auto; 'approve' if r < t.approve else 'multi-party'",
      intent:
        'Encode the human-in-the-loop policy used by every Sentra/Counsel/Terra mutating action.',
      citations: ['docs/A11OY_AGENT_DOCTRINE.md', 'docs/A11OY_NON_NEGOTIABLES.md'],
    },
    parameters: [
      { name: 'autoThreshold', description: 'Below this risk, action is fully autonomous', default: 0.2, range: [0, 1] },
      { name: 'approveThreshold', description: 'Below this risk, single-approver is enough', default: 0.6, range: [0, 1] },
    ],
    impl: ({ risk, autoThreshold, approveThreshold }: { risk: number; autoThreshold?: number; approveThreshold?: number }) =>
      autonomyGate(risk, autoThreshold, approveThreshold),
    inputShape: '{ risk in [0,1], autoThreshold?, approveThreshold? }',
    outputShape: "'auto' | 'approve' | 'multi-party'",
    consumers: [
      'artifacts/sentra/src/brain/lib/autonomy.ts',
      'artifacts/api-server/src/routes/a11oy-runtime-api.ts',
    ],
  },

  {
    id: 'escalation-delay',
    name: 'Escalation delay (seconds)',
    domain: 'governance',
    version: '1.0.0',
    description:
      'Exponential back-off for unanswered approval requests — ceiling configurable per tenant.',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§4.4',
      thesisVersion: 'v10',
      equation: 't_n = min(t_max, t_0 · 2^n)',
      intent:
        'Bound the time before an unanswered approval is escalated up the chain.',
    },
    parameters: [
      { name: 't0', description: 'Initial delay (sec)', default: 60, range: [10, 3600], units: 's' },
      { name: 'tMax', description: 'Maximum delay (sec)', default: 3600, range: [60, 86400], units: 's' },
    ],
    impl: ({ n, t0, tMax }: { n: number; t0?: number; tMax?: number }) => escalationDelaySeconds(n, t0, tMax),
    inputShape: '{ n: integer ≥ 0, t0?, tMax? }',
    outputShape: 'number (seconds)',
    consumers: ['artifacts/api-server/src/routes/a11oy-runtime-api.ts'],
  },

  // ─── Scoring ─────────────────────────────────────────────────────────
  {
    id: 'proof-closure-score',
    name: 'Proof-closure score',
    domain: 'scoring',
    version: '1.0.0',
    description:
      'Fraction of evidence dimensions that have a present artefact (CODE/CODEX/API/TEST/THESIS/SURFACE).',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§2.6 (Λ₁₀ closure)',
      thesisVersion: 'v10',
      equation: 'ρ = Σ_k Lₖ · ∏_j 𝟙[jₖ] / Σ_k Lₖ',
      intent: 'Make the operational drift of any decision artefact a single number in [0, 1].',
    },
    parameters: [],
    impl: ({ presentDims, totalDims }: { presentDims: number; totalDims: number }) =>
      proofClosureScore(presentDims, totalDims),
    inputShape: '{ presentDims: integer, totalDims: integer }',
    outputShape: 'number in [0, 1]',
    consumers: ['artifacts/a11oy/src/pages/ProofLedger.tsx', 'artifacts/sentra/src/brain/lib/proof.ts'],
  },

  // ─── Evolution (ROSIE) ───────────────────────────────────────────────
  {
    id: 'rosie-proposal-score',
    name: 'ROSIE tuning-proposal score',
    domain: 'evolution',
    version: '1.0.0',
    description:
      'Score for a proposed parameter tuning — combines observed performance gap, sample size, drift, and reversibility.',
    provenance: {
      thesisDoc: 'v10-canonical.md',
      thesisSection: '§6.1 (continuous-evolution loop)',
      thesisVersion: 'v10',
      equation:
        's = w₁·gap + w₂·log(1+samples) + w₃·drift − w₄·irreversibility',
      intent:
        'Let ROSIE rank candidate tunings so the operator sees the most evidence-rich proposals first.',
    },
    parameters: [
      { name: 'wGap', description: 'Weight on observed performance gap', default: 0.5, range: [0, 1] },
      { name: 'wSamples', description: 'Weight on sample-size confidence', default: 0.2, range: [0, 1] },
      { name: 'wDrift', description: 'Weight on parameter drift', default: 0.2, range: [0, 1] },
      { name: 'wIrr', description: 'Penalty for irreversible changes', default: 0.1, range: [0, 1] },
    ],
    impl: (
      input: { gap: number; samples: number; drift: number; irreversibility: number; weights?: { wGap?: number; wSamples?: number; wDrift?: number; wIrr?: number } },
    ) => rosieProposalScore(input),
    inputShape: '{ gap, samples, drift, irreversibility, weights? }',
    outputShape: 'number (proposal priority)',
    consumers: ['artifacts/sentra/src/brain/lib/rosie-loop.ts'],
  },
] as const;

export function getFormula(id: string): FormulaSpec | undefined {
  return FORMULA_REGISTRY.find((f) => f.id === id);
}

export function listByDomain(domain: FormulaDomain): readonly FormulaSpec[] {
  return FORMULA_REGISTRY.filter((f) => f.domain === domain);
}
