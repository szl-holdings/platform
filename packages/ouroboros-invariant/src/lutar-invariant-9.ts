/**
 * Lutar Invariant — extended forms Λ₆, Λ₇, Λ₈, Λ₉.
 *
 * Λ₅ (existing) introduced axis G (Gauß closure) on top of {C, H, R, F}.
 * This file extends the family additively without breaking older APIs:
 *
 *   Λ₆ = C^(1/6) · H^(1/6) · R^(1/6) · F^(1/6) · G^(1/6) · I^(1/6)
 *   Λ₇ = Λ₆ · M^(1/7) factor — 7 axes, each weight 1/7
 *   Λ₈ = 8 axes, each weight 1/8 — adds B (Socratic ontic grounding)
 *   Λ₉ = 9 axes, each weight 1/9 — adds N (Lara non-measurability honesty)
 *
 * Axis catalogue:
 *   C — Cleanliness (cryptographic)
 *   H — Horizon     (Page-curve reversibility)
 *   R — Resonance   (Q-factor / Landauer)
 *   F — Frustum     (three-witness Jaccard)
 *   G — Gauß closure (least-squares network adjustment)
 *   I — Invariance   (Blanca: Lorentz / equivalence / EPR-bound holding)
 *   M — Moral        (Oppenheimer accountability ledger)
 *   B — Being        (Socrates divided-line ontic grounding)
 *   N — Non-measurability honesty (Lara: Jamneshan–Shalom–Tao gap declarations)
 *
 * Each weight is a single Egyptian unit fraction (1/k), preserving the
 * inspectability axiom A3 trivially.
 *
 * Bound theorem unchanged: 0 ≤ Λ_k ≤ min(axes) ≤ max(axes) ≤ 1.
 */

import { reconstructFraction } from "@workspace/reconciliation";
import { inspectableWeight, type InspectableWeight } from "./lutar-invariant.js";

export interface LutarAxes6 {
  cleanliness: number;
  horizon: number;
  resonance: number;
  frustum: number;
  gaussClosure: number;
  invariance: number; // I — Blanca
}
export interface LutarAxes7 extends LutarAxes6 {
  moralGrounding: number; // M — Oppenheimer
}
export interface LutarAxes8 extends LutarAxes7 {
  ontologicalGrounding: number; // B — Socrates
}
export interface LutarAxes9 extends LutarAxes8 {
  measurabilityHonesty: number; // N — Lara
}

export interface LutarReportN {
  invariant: number;
  axesUsed: string[];
  axisValues: Record<string, number>;
  weight: number; // single Egyptian unit fraction value (1/k)
  formula: string;
  bound: { lower: number; upper: number };
  weightSumExact: boolean;
}

function validateAxes(axes: Record<string, number>): void {
  for (const [name, v] of Object.entries(axes)) {
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(`axis ${name} = ${v} must be in [0,1]`);
    }
  }
}

function computeLambda(axes: Record<string, number>, k: number): LutarReportN {
  validateAxes(axes);
  if (Object.keys(axes).length !== k) {
    throw new Error(`lambda${k} requires exactly ${k} axes; got ${Object.keys(axes).length}`);
  }
  const w: InspectableWeight = inspectableWeight(1, k); // weight = 1/k as single unit fraction
  const allTerms: number[] = [];
  for (let i = 0; i < k; i++) allTerms.push(...w.terms);
  const r = reconstructFraction(allTerms);
  const weightSumExact = r.numerator === r.denominator && r.numerator > 0;
  if (!weightSumExact) {
    throw new Error(`weights are not Egyptian-exact (k=${k})`);
  }

  const values = Object.values(axes);
  const minAxis = Math.min(...values);
  const maxAxis = Math.max(...values);

  let invariant: number;
  if (values.some((v) => v === 0)) {
    invariant = 0;
  } else {
    let logL = 0;
    for (const v of values) logL += w.value * Math.log(v);
    invariant = Math.exp(logL);
  }

  const ax = Object.keys(axes);
  const formula = `Λ${subscriptDigit(k)} = ${ax.map((a) => `${shortName(a)}^(1/${k})`).join(" · ")}`;

  return {
    invariant,
    axesUsed: ax,
    axisValues: axes,
    weight: w.value,
    formula,
    bound: { lower: minAxis, upper: maxAxis },
    weightSumExact,
  };
}

function shortName(name: string): string {
  return (
    {
      cleanliness: "C",
      horizon: "H",
      resonance: "R",
      frustum: "F",
      gaussClosure: "G",
      invariance: "I",
      moralGrounding: "M",
      ontologicalGrounding: "B",
      measurabilityHonesty: "N",
    } as Record<string, string>
  )[name] ?? name;
}

function subscriptDigit(n: number): string {
  const map: Record<string, string> = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
  };
  return String(n)
    .split("")
    .map((d) => map[d] ?? d)
    .join("");
}

export function lutarInvariant6(axes: LutarAxes6): LutarReportN {
  return computeLambda(axes as unknown as Record<string, number>, 6);
}
export function lutarInvariant7(axes: LutarAxes7): LutarReportN {
  return computeLambda(axes as unknown as Record<string, number>, 7);
}
export function lutarInvariant8(axes: LutarAxes8): LutarReportN {
  return computeLambda(axes as unknown as Record<string, number>, 8);
}
export function lutarInvariant9(axes: LutarAxes9): LutarReportN {
  return computeLambda(axes as unknown as Record<string, number>, 9);
}

export function verifyLutarBoundN(report: LutarReportN): boolean {
  const eps = 1e-12;
  const values = Object.values(report.axisValues);
  const minAxis = Math.min(...values);
  const maxAxis = Math.max(...values);
  // Geometric mean is bounded: min ≤ Λ ≤ max (AM-GM corollary).
  // Special case: if any axis is 0, Λ = 0, which equals min = 0.
  return (
    report.invariant >= 0 - eps &&
    report.invariant >= minAxis - eps &&
    report.invariant <= maxAxis + eps &&
    minAxis <= maxAxis &&
    maxAxis <= 1 + eps
  );
}
