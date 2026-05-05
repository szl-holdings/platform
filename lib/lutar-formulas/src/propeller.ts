/**
 * Propeller P_Λ — the SZL "drive" formula from
 * `papers/paper-09-propeller-sota-routing.tex` and the A11oy Ultra payload.
 *
 *     P_Λ = ρ_I · A_ω · Δv_L · (2 / (1 + v_out/v_in)) · cos θ
 *
 * Reads:
 *
 *   ρ_I  — intelligence density       intel / (input_cost + output_cost)
 *   A_ω  — attention area             heads · log(1 + headroom_k)
 *   Δv_L — Lutar velocity delta       Ω_out − Ω_in   (both > 0)
 *   2/(1 + v_out/v_in) — Froude term  hull/wake interaction
 *   cos θ — alignment of the model's "step" vector with the goal vector
 *
 * Interpretation: like a propeller in fluid dynamics, the rate of useful
 * work depends on density × swept area × velocity change, modulated by
 * a Froude-like efficiency term and the alignment of force and intent.
 *
 * P_Λ is the "drive score" used by the agentic loop's halt condition
 * (`if pr.thrust < min_thrust: closure reached`).
 */
import type { ModelSpec, QuerySpec } from './omega.js';

export interface PropellerReading {
  thrust: number;
  froude: number;
  alignment: number;
  /** Combined drive score: P_Λ = thrust · froude · alignment */
  P_lambda: number;
  notes: string;
}

export function rhoI(m: ModelSpec): number {
  return m.intelligence / Math.max(m.inputCost + m.outputCost, 1e-6);
}

export function aOmega(m: ModelSpec, q: QuerySpec): number {
  const heads = Math.max(1, Math.floor(m.intelligence / 4));
  const headroomK = Math.max(0, (m.context - q.inTokens - q.outTokens) / 1000);
  return heads * Math.log1p(headroomK);
}

export function cosineSim(a: readonly number[], b: readonly number[]): number {
  if (!a.length || !b.length) return 0;
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.max(Math.sqrt(na) * Math.sqrt(nb), 1e-12);
  const v = dot / denom;
  return Math.max(-1, Math.min(1, v));
}

export function propeller(
  m: ModelSpec,
  q: QuerySpec,
  omegaIn: number,
  omegaOut: number,
  goal: readonly number[],
  step: readonly number[],
): PropellerReading {
  const dv = Math.max(omegaOut - omegaIn, 1e-6);
  const thrust = rhoI(m) * aOmega(m, q) * dv;
  const froude = 2.0 / (1.0 + omegaOut / Math.max(omegaIn, 1e-6));
  const align = cosineSim(goal, step);
  const round = (v: number) => Math.round(v * 1e4) / 1e4;
  return {
    thrust: round(thrust),
    froude: round(froude),
    alignment: round(align),
    P_lambda: round(thrust * froude * align),
    notes:
      `ρ_I=${rhoI(m).toFixed(2)} A_ω=${aOmega(m, q).toFixed(2)} ` +
      `Δv=${dv.toFixed(3)}`,
  };
}
