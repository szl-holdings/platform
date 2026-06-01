/**
 * lambda_axis/ — T03 Λ-Axis substrate.
 *
 * Backing (PARTIAL): delegates to invariants/ (T01) for the core Λ computation.
 * The thesis spec defines NINE axes; the live runtime
 * (sentra/web/src/lib/ouroboros-compute.ts) scores a FOUR-axis instance. This
 * module exposes the 9-axis interface honestly: it computes Λ over whatever axes
 * are supplied (the geometric mean generalizes to any k), and documents that
 * only 4 are wired into a shipping decision today. No mock — real Λ over k axes.
 *
 * Formal layer: Lutar/Lambda/SchurConcave.lean (lambda_two_axis_schur_concave
 * proven; n-axis Schur-concavity is axiom-structured — see lean/).
 */

import { lambda as coreLambda } from "../invariants/index.ts";
import type { LambdaResult } from "../invariants/index.ts";

/** The 9 axis names from the Λ-Axis spec (chapters/02_mathematical_foundations). */
export const NINE_AXES = [
  "cleanliness",
  "horizon",
  "resonance",
  "frustum",
  "calibration",
  "provenance",
  "containment",
  "reversibility",
  "attribution",
] as const;

/** The 4 axes actually wired into a shipping decision today. */
export const WIRED_AXES = ["cleanliness", "horizon", "resonance", "frustum"] as const;

export type AxisMap = Partial<Record<(typeof NINE_AXES)[number], number>>;

/**
 * lambdaOverAxes — compute Λ over a named axis map. Generalizes the 4-axis
 * runtime to the full 9-axis interface. Missing axes are omitted (Λ is taken
 * over the supplied axes), which is reported in the result.
 */
export function lambdaOverAxes(axes: AxisMap): LambdaResult & { axisNames: string[]; wiredOnly: boolean } {
  const names = NINE_AXES.filter((n) => typeof axes[n] === "number");
  const values = names.map((n) => axes[n] as number);
  const result = coreLambda(values);
  const wiredOnly = names.every((n) => (WIRED_AXES as readonly string[]).includes(n));
  return { ...result, axisNames: [...names], wiredOnly };
}
