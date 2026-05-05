/**
 * Lutar Ω (L_Omega) — the seven-signature hierarchy from
 * `papers/paper-01-lutar-omega-formalism.tex`, plus the operational
 * six-signature routing variant L1..L6 from the A11oy Ultra payload
 * (`attached_assets/Pasted-…A11OY-ULTRA-…`).
 *
 * Two surfaces are exposed:
 *
 *   1. **Theoretical** — `omegaSignatures(...)` returns the full physics
 *      stack (E/mc², Bekenstein, conformal, thermodynamic, Berry, E8,
 *      Noether). For papers and explainers.
 *
 *   2. **Operational** — `routerSignatures(...)` returns the six axes
 *      used at runtime to score a model against a query:
 *
 *        L1 = (intel · log(1+in_tok)) / cost              cost-efficiency
 *        L2 = tps² / latency_ms                            speed
 *        L3 = log(1 + headroom) · intel                    context fit
 *        L4 = exp(matched_strengths) / (1+input_cost)      capability
 *        L5 = intel · 1 / (1 - batch_discount)             batch leverage
 *        L6 = sqrt(L1 · L2)                                geometric blend
 *
 *      L_Ω = Σ wᵢ Lᵢ over a simplex of weights.
 */

// ─────────────────────────────────────────────────────────────────────────
// Operational hierarchy (used by router/Xi)
// ─────────────────────────────────────────────────────────────────────────

export interface ModelSpec {
  /** Linear $/Mtoken */
  inputCost: number;
  outputCost: number;
  /** Tokens per second */
  tps: number;
  /** Maximum context window in tokens */
  context: number;
  /** Coarse "intelligence" score (Artificial Analysis-style index) */
  intelligence: number;
  /** Provider batch discount in [0, 1] (e.g. 0.5 for OpenAI batch API) */
  batchDiscount: number;
  /** Capabilities the model is good at — used for L4 matching */
  strengths: readonly string[];
}

export interface QuerySpec {
  inTokens: number;
  outTokens: number;
  /** Capability tags the query requires (matched against `strengths`) */
  require: readonly string[];
  batch: boolean;
}

export interface OmegaWeights {
  L1: number;
  L2: number;
  L3: number;
  L4: number;
  L5: number;
  L6: number;
}

/** Curated default mode → weight presets, matching the A11oy Ultra payload. */
export const OMEGA_MODES: Record<string, OmegaWeights> = {
  ultra:   { L1: 0.12, L2: 0.22, L3: 0.14, L4: 0.22, L5: 0.10, L6: 0.20 },
  chat:    { L1: 0.14, L2: 0.22, L3: 0.10, L4: 0.25, L5: 0.09, L6: 0.20 },
  agentic: { L1: 0.15, L2: 0.20, L3: 0.10, L4: 0.25, L5: 0.10, L6: 0.20 },
  supreme: { L1: 0.10, L2: 0.05, L3: 0.25, L4: 0.30, L5: 0.05, L6: 0.25 },
  cheap:   { L1: 0.45, L2: 0.05, L3: 0.10, L4: 0.25, L5: 0.10, L6: 0.05 },
  fast:    { L1: 0.05, L2: 0.55, L3: 0.05, L4: 0.15, L5: 0.10, L6: 0.10 },
  batch:   { L1: 0.25, L2: 0.10, L3: 0.15, L4: 0.15, L5: 0.25, L6: 0.10 },
  council: { L1: 0.10, L2: 0.10, L3: 0.20, L4: 0.30, L5: 0.10, L6: 0.20 },
  propel:  { L1: 0.10, L2: 0.25, L3: 0.15, L4: 0.20, L5: 0.05, L6: 0.25 },
};

export function L1(m: ModelSpec, q: QuerySpec): number {
  const C = Math.max(m.inputCost + m.outputCost, 1e-6);
  return (m.intelligence * Math.log1p(q.inTokens)) / C;
}
export function L2(m: ModelSpec, q: QuerySpec): number {
  const lat = Math.max((q.outTokens / m.tps) * 1000, 1e-3);
  return (m.tps * m.tps) / lat;
}
export function L3(m: ModelSpec, q: QuerySpec): number {
  const head = m.context - (q.inTokens + q.outTokens);
  return Math.log1p(Math.max(head, 0)) * m.intelligence;
}
export function L4(m: ModelSpec, q: QuerySpec): number {
  const set = new Set(m.strengths);
  const match = q.require.reduce((n, s) => n + (set.has(s) ? 1 : 0), 0);
  return Math.exp(match) / (1 + m.inputCost);
}
export function L5(m: ModelSpec, q: QuerySpec): number {
  const d = q.batch ? 1 - m.batchDiscount : 1;
  return m.intelligence * (1 / Math.max(d, 0.1));
}
export function L6(m: ModelSpec, q: QuerySpec): number {
  return Math.sqrt(L1(m, q) * L2(m, q));
}

export interface OmegaSignatures {
  L1: number; L2: number; L3: number; L4: number; L5: number; L6: number;
}

export function routerSignatures(m: ModelSpec, q: QuerySpec): OmegaSignatures {
  return { L1: L1(m, q), L2: L2(m, q), L3: L3(m, q), L4: L4(m, q), L5: L5(m, q), L6: L6(m, q) };
}

/** L_Ω = Σ wᵢ Lᵢ on the operational hierarchy. */
export function lOmega(m: ModelSpec, q: QuerySpec, w: OmegaWeights): number {
  const s = routerSignatures(m, q);
  return w.L1 * s.L1 + w.L2 * s.L2 + w.L3 * s.L3 + w.L4 * s.L4 + w.L5 * s.L5 + w.L6 * s.L6;
}

/** Validate that a weight vector forms a probability simplex (sums to 1). */
export function isSimplex(w: OmegaWeights, eps = 1e-9): boolean {
  return Math.abs(w.L1 + w.L2 + w.L3 + w.L4 + w.L5 + w.L6 - 1) < eps;
}

// ─────────────────────────────────────────────────────────────────────────
// Theoretical hierarchy (paper-01)
//
//   L1 = E / (mc²)                       Einstein baseline
//   L2 = L1 · S/S_max                    Bekenstein information bound
//   L3 = L2 · Ω⁻²                        Penrose CCC conformal rescaling
//   L4 = L3 · exp(-S/k_BT)               Boltzmann–Shannon coupling
//   L5 = L4 · exp(iγ)                    Berry phase (returns magnitude)
//   L6 = |L5| · ⟨Γ_E8, v̂⟩                E8 lattice projection
//   L7 = L6 · 𝟙[∂_t Q = 0]              Noether-closed indicator
// ─────────────────────────────────────────────────────────────────────────

export interface PhysicsContext {
  /** System energy (J) */
  E: number;
  /** Rest mass (kg) */
  m: number;
  /** Shannon entropy of the candidate (nats) */
  S: number;
  /** Surface area for the Bekenstein bound (m²) */
  A: number;
  /** Conformal rescaling factor Ω */
  conformal: number;
  /** Temperature (K) */
  T: number;
  /** Berry phase γ (radians) */
  berryPhase: number;
  /** Inner product ⟨Γ_E8, v̂⟩ in [-1, 1] */
  e8Projection: number;
  /** True if Noether charge ∂_t Q = 0 is satisfied */
  noetherClosed: boolean;
}

const C_LIGHT = 299_792_458;
const K_B = 1.380649e-23;
const L_PLANCK = 1.616255e-35;

export interface PhysicsSignatures {
  L1: number; L2: number; L3: number; L4: number;
  L5_magnitude: number; L5_phase: number;
  L6: number; L7: number;
}

export function physicsSignatures(ctx: PhysicsContext): PhysicsSignatures {
  const L1v = ctx.E / (ctx.m * C_LIGHT * C_LIGHT);
  const Smax = (K_B * ctx.A) / (4 * L_PLANCK * L_PLANCK);
  const L2v = L1v * (ctx.S / Math.max(Smax, 1e-300));
  const L3v = L2v * Math.pow(ctx.conformal, -2);
  const L4v = L3v * Math.exp(-ctx.S / Math.max(K_B * ctx.T, 1e-300));
  // Berry-phase factor exp(iγ) — magnitude is 1, phase carried separately.
  const L5_magnitude = Math.abs(L4v);
  const L5_phase = ctx.berryPhase;
  const L6v = L5_magnitude * ctx.e8Projection;
  const L7v = ctx.noetherClosed ? L6v : 0;
  return { L1: L1v, L2: L2v, L3: L3v, L4: L4v, L5_magnitude, L5_phase, L6: L6v, L7: L7v };
}
