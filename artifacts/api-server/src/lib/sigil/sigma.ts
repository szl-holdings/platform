/**
 * SIGIL · Σ Composition Law (SZL Holdings, 2026)
 *
 * Σ is SZL's closed-form trust scalar in [0,1]. It compounds four
 * independent runtime axes through a weighted geometric mean whose
 * weights are exact rationals (see ./rationals).
 *
 *     Σ = P^wₚ · K^wₖ · Φ^wᵩ · C^wₒ
 *
 *   P — Provenance      ∈ [0,1]   verifiable-lineage fraction
 *   K — Containment     ∈ [0,1]   release-rate inside boundary capacity
 *   Φ — Coherence       ∈ [0,1]   multi-agent phase order parameter
 *   C — Convergence     ∈ [0,1]   N-witness reconciliation Jaccard
 *
 *   wₚ + wₖ + wᵩ + wₒ = 1, every wᵢ a finite distinct unit-fraction sum.
 *
 * Σ has three properties enforced at runtime:
 *
 *   (a) Zero-pinning: if any axis is zero, Σ ≡ 0 exactly.
 *   (b) Monotonicity: ∂Σ/∂axisᵢ ≥ 0.
 *   (c) Bound: 0 ≤ minᵢ(axisᵢ) ≤ Σ ≤ maxᵢ(axisᵢ) ≤ 1.
 *       (Standard weighted-geometric-mean envelope; tightens to the
 *       common axis value when all axes coincide.)
 *
 * The geometric-mean form (Cauchy 1821) is well established. What is
 * SZL's: the four-axis choice tailored to the A11oy/Sentra/Amaru
 * platform surface, the rational-weight gate at the boundary, and
 * the explicit Σ-default of (1/4, 1/4, 1/4, 1/4) which makes every
 * axis equally accountable on first deployment.
 */

import {
        inspectableWeight,
        weightsSumToOne,
        sumUnitFractions,
        type InspectableWeight,
        renderWeight,
} from './rationals.js';

export type Axis = 'provenance' | 'containment' | 'coherence' | 'convergence';

export interface SigilAxes {
        readonly provenance: number;
        readonly containment: number;
        readonly coherence: number;
        readonly convergence: number;
}

export interface SigilWeights {
        readonly provenance: InspectableWeight;
        readonly containment: InspectableWeight;
        readonly coherence: InspectableWeight;
        readonly convergence: InspectableWeight;
}

export interface SigilReport {
        readonly sigma: number;
        readonly axes: SigilAxes;
        readonly weights: {
                readonly provenance: { terms: readonly number[]; value: number; rendered: string };
                readonly containment: { terms: readonly number[]; value: number; rendered: string };
                readonly coherence: { terms: readonly number[]; value: number; rendered: string };
                readonly convergence: { terms: readonly number[]; value: number; rendered: string };
        };
        readonly proof: {
                readonly weightsExact: boolean;
                readonly minAxis: number;
                readonly maxAxis: number;
                readonly bound: { lower: number; upper: number };
                readonly formula: string;
                readonly law: string;
        };
}

export function defaultWeights(): SigilWeights {
        const w = inspectableWeight(1, 4);
        return { provenance: w, containment: w, coherence: w, convergence: w };
}

const AXIS_ORDER: Axis[] = ['provenance', 'containment', 'coherence', 'convergence'];

function ensureAxis(name: Axis, v: number): void {
        if (!Number.isFinite(v) || v < 0 || v > 1) {
                throw new Error(`sigil/sigma: axis ${name} = ${v} must be in [0,1]`);
        }
}

/**
 * Recompute a weight's float value strictly from its unit-fraction terms.
 * This closes the gap where a caller could pass a `value` field that
 * disagrees with `terms` and slip past the rational-sum gate. Every Σ
 * exponent used in composition is derived from this canonical value, never
 * from the externally-supplied `value` field.
 */
function canonicalWeightValue(name: Axis, w: InspectableWeight): number {
        if (!w || !Array.isArray(w.terms) || w.terms.length === 0) {
                throw new Error(`sigil/sigma: weight ${name} has no unit-fraction terms`);
        }
        for (const t of w.terms) {
                if (!Number.isInteger(t) || t <= 0) {
                        throw new Error(`sigil/sigma: weight ${name} term ${t} must be a positive integer`);
                }
        }
        const r = sumUnitFractions(w.terms);
        if (r.denominator === 0) {
                throw new Error(`sigil/sigma: weight ${name} terms reduced to non-finite value`);
        }
        return r.numerator / r.denominator;
}

export function sigma(axes: SigilAxes, weights: SigilWeights = defaultWeights()): SigilReport {
        for (const name of AXIS_ORDER) ensureAxis(name, axes[name]);

        const weightsExact = weightsSumToOne([
                weights.provenance,
                weights.containment,
                weights.coherence,
                weights.convergence,
        ]);
        if (!weightsExact) {
                throw new Error('sigil/sigma: weights are not rationally exact (must sum to 1 over unit-fraction terms)');
        }

        // Recompute every exponent strictly from the (already-gated) terms.
        // The supplied `value` field is informational; it is never trusted
        // as an exponent. This keeps the rational gate canonical.
        const wp = canonicalWeightValue('provenance', weights.provenance);
        const wk = canonicalWeightValue('containment', weights.containment);
        const wphi = canonicalWeightValue('coherence', weights.coherence);
        const wc = canonicalWeightValue('convergence', weights.convergence);

        const values = AXIS_ORDER.map(a => axes[a]);
        const minAxis = Math.min(...values);
        const maxAxis = Math.max(...values);

        let computed: number;
        if (values.some(v => v === 0)) {
                computed = 0;
        } else {
                const logS =
                        wp * Math.log(axes.provenance) +
                        wk * Math.log(axes.containment) +
                        wphi * Math.log(axes.coherence) +
                        wc * Math.log(axes.convergence);
                computed = Math.exp(logS);
        }

        return {
                sigma: computed,
                axes,
                weights: {
                        provenance: { terms: weights.provenance.terms, value: wp, rendered: renderWeight(weights.provenance) },
                        containment: { terms: weights.containment.terms, value: wk, rendered: renderWeight(weights.containment) },
                        coherence: { terms: weights.coherence.terms, value: wphi, rendered: renderWeight(weights.coherence) },
                        convergence: { terms: weights.convergence.terms, value: wc, rendered: renderWeight(weights.convergence) },
                },
                proof: {
                        weightsExact,
                        minAxis,
                        maxAxis,
                        bound: { lower: minAxis, upper: maxAxis },
                        formula: `Σ = P^(${renderWeight(weights.provenance)}) · K^(${renderWeight(weights.containment)}) · Φ^(${renderWeight(weights.coherence)}) · C^(${renderWeight(weights.convergence)})`,
                        law: 'SIGIL Σ — SZL Integrated Governance & Invariant Layer (2026)',
                },
        };
}

/**
 * Numerically verify the bound theorem on a Σ report:
 *   0 ≤ minᵢ(axisᵢ) ≤ Σ ≤ maxᵢ(axisᵢ) ≤ 1.
 *
 * The lower bound is loosened to min when at least one axis is non-zero;
 * if any axis is zero the zero-pinning rule forces Σ = 0 (and minAxis = 0
 * also, so the inequality still holds at equality).
 */
export function verifyBound(r: SigilReport): boolean {
        const eps = 1e-12;
        return (
                r.sigma >= 0 - eps &&
                r.sigma >= r.proof.minAxis - 1e-9 &&
                r.sigma <= r.proof.maxAxis + 1e-9 &&
                r.proof.minAxis <= r.proof.maxAxis &&
                r.proof.maxAxis <= 1 + eps
        );
}
